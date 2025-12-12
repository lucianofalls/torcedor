import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { query } from '../config/database';
import { extractToken, verifyToken } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';

export const submit = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Check if request has token (authenticated) or CPF (anonymous)
    const token = extractToken(event.headers.Authorization || event.headers.authorization);
    const quizId = event.pathParameters?.quizId;
    const body = JSON.parse(event.body || '{}');

    if (!quizId) {
      return errorResponse('ID do quiz não fornecido', 400);
    }

    const { question_id, option_id, time_taken_ms, cpf } = body;

    if (!question_id || !option_id || time_taken_ms === undefined) {
      return errorResponse('Dados da resposta incompletos', 400);
    }

    // Determine if authenticated or anonymous
    const isAuthenticated = !!token;
    const isAnonymous = !!cpf;

    if (!isAuthenticated && !isAnonymous) {
      return errorResponse('Token ou CPF deve ser fornecido', 401);
    }

    let participantResult;

    if (isAuthenticated) {
      // Authenticated user - find by user_id
      const payload = verifyToken(token);
      participantResult = await query(
        'SELECT * FROM quiz_participants WHERE quiz_id = $1 AND user_id = $2',
        [quizId, payload.userId]
      );
    } else {
      // Anonymous user - find by CPF
      participantResult = await query(
        'SELECT * FROM quiz_participants WHERE quiz_id = $1 AND cpf = $2',
        [quizId, cpf]
      );
    }

    if (participantResult.rows.length === 0) {
      return errorResponse('Você não está participando deste quiz', 403);
    }

    const participant = participantResult.rows[0];

    // Verificar se o participante já completou o quiz
    if (participant.completed_at) {
      return errorResponse('Você já completou este quiz', 403);
    }

    // Verificar se a resposta já foi enviada
    const existingAnswer = await query(
      'SELECT id FROM participant_answers WHERE participant_id = $1 AND question_id = $2',
      [participant.id, question_id]
    );

    if (existingAnswer.rows.length > 0) {
      return errorResponse('Você já respondeu esta pergunta', 400);
    }

    // Verificar se a opção está correta
    const optionResult = await query(
      'SELECT o.is_correct, q.points FROM options o JOIN questions q ON o.question_id = q.id WHERE o.id = $1',
      [option_id]
    );

    if (optionResult.rows.length === 0) {
      return errorResponse('Opção não encontrada', 404);
    }

    const option = optionResult.rows[0];
    const isCorrect = option.is_correct;
    const points = isCorrect ? option.points : 0;

    // Calcular pontos baseado no tempo (quanto mais rápido, mais pontos)
    // Pontos = pontos_base * (1 - (tempo_gasto / tempo_limite) * 0.5)
    const questionResult = await query(
      'SELECT time_limit FROM questions WHERE id = $1',
      [question_id]
    );

    const timeLimit = questionResult.rows[0].time_limit * 1000; // converter para ms
    const timeFactor = Math.max(0, 1 - (time_taken_ms / timeLimit) * 0.5);
    const finalPoints = isCorrect ? Math.round(points * timeFactor) : 0;

    // Inserir resposta
    await query(
      `INSERT INTO participant_answers (participant_id, question_id, option_id, time_taken, is_correct, points_earned)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [participant.id, question_id, option_id, time_taken_ms, isCorrect, finalPoints]
    );

    // Atualizar pontuação total do participante
    await query(
      `UPDATE quiz_participants
       SET total_score = total_score + $1
       WHERE id = $2`,
      [finalPoints, participant.id]
    );

    // Verificar se o participante respondeu todas as perguntas do quiz
    const totalQuestionsResult = await query(
      'SELECT COUNT(*) as total FROM questions WHERE quiz_id = $1',
      [quizId]
    );
    const totalQuestions = parseInt(totalQuestionsResult.rows[0].total);

    const answeredQuestionsResult = await query(
      'SELECT COUNT(*) as answered FROM participant_answers WHERE participant_id = $1',
      [participant.id]
    );
    const answeredQuestions = parseInt(answeredQuestionsResult.rows[0].answered);

    // Se respondeu todas as perguntas, marcar como completado
    let quizCompleted = false;
    if (answeredQuestions >= totalQuestions) {
      await query(
        'UPDATE quiz_participants SET completed_at = NOW() WHERE id = $1',
        [participant.id]
      );
      quizCompleted = true;
    }

    return successResponse({
      is_correct: isCorrect,
      points_earned: finalPoints,
      time_taken_ms,
      quiz_completed: quizCompleted,
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    return errorResponse('Erro ao enviar resposta', 500, error);
  }
};
