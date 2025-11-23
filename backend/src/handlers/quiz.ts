import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { query } from '../config/database';
import { extractToken, verifyToken } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';
import { generateQuizCode } from '../utils/codeGenerator';

export const create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = extractToken(event.headers.Authorization || event.headers.authorization);
    if (!token) {
      return errorResponse('Token não fornecido', 401);
    }

    const payload = verifyToken(token);
    const body = JSON.parse(event.body || '{}');
    const { title, description, max_participants = 50 } = body;

    if (!title) {
      return errorResponse('Título é obrigatório', 400);
    }

    const code = generateQuizCode();

    const result = await query(
      `INSERT INTO quizzes (creator_id, title, description, code, max_participants)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [payload.userId, title, description, code, max_participants]
    );

    return successResponse(result.rows[0], 201);
  } catch (error) {
    console.error('Create quiz error:', error);
    return errorResponse('Erro ao criar quiz', 500, error);
  }
};

export const list = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = extractToken(event.headers.Authorization || event.headers.authorization);
    if (!token) {
      return errorResponse('Token não fornecido', 401);
    }

    const payload = verifyToken(token);

    const result = await query(
      `SELECT q.*, u.name as creator_name,
              (SELECT COUNT(*) FROM quiz_participants WHERE quiz_id = q.id) as participant_count
       FROM quizzes q
       JOIN users u ON q.creator_id = u.id
       WHERE q.creator_id = $1
       ORDER BY q.created_at DESC`,
      [payload.userId]
    );

    return successResponse(result.rows);
  } catch (error) {
    console.error('List quizzes error:', error);
    return errorResponse('Erro ao listar quizzes', 500, error);
  }
};

export const get = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = extractToken(event.headers.Authorization || event.headers.authorization);
    if (!token) {
      return errorResponse('Token não fornecido', 401);
    }

    verifyToken(token);
    const quizId = event.pathParameters?.id;

    if (!quizId) {
      return errorResponse('ID do quiz não fornecido', 400);
    }

    // Buscar quiz
    const quizResult = await query(
      `SELECT q.*, u.name as creator_name,
              (SELECT COUNT(*) FROM quiz_participants WHERE quiz_id = q.id) as participant_count
       FROM quizzes q
       JOIN users u ON q.creator_id = u.id
       WHERE q.id = $1`,
      [quizId]
    );

    if (quizResult.rows.length === 0) {
      return errorResponse('Quiz não encontrado', 404);
    }

    // Buscar perguntas
    const questionsResult = await query(
      `SELECT q.*, json_agg(
         json_build_object(
           'id', o.id,
           'option_text', o.option_text,
           'option_order', o.option_order
         ) ORDER BY o.option_order
       ) as options
       FROM questions q
       LEFT JOIN options o ON q.id = o.question_id
       WHERE q.quiz_id = $1
       GROUP BY q.id
       ORDER BY q.question_order`,
      [quizId]
    );

    const quiz = quizResult.rows[0];
    quiz.questions = questionsResult.rows;

    return successResponse(quiz);
  } catch (error) {
    console.error('Get quiz error:', error);
    return errorResponse('Erro ao buscar quiz', 500, error);
  }
};

export const join = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = extractToken(event.headers.Authorization || event.headers.authorization);
    if (!token) {
      return errorResponse('Token não fornecido', 401);
    }

    const payload = verifyToken(token);
    const code = event.pathParameters?.code;

    if (!code) {
      return errorResponse('Código do quiz não fornecido', 400);
    }

    // Buscar quiz pelo código
    const quizResult = await query(
      `SELECT * FROM quizzes WHERE code = $1 AND status = 'active'`,
      [code]
    );

    if (quizResult.rows.length === 0) {
      return errorResponse('Quiz não encontrado ou não está ativo', 404);
    }

    const quiz = quizResult.rows[0];

    // Verificar número de participantes
    const participantCount = await query(
      'SELECT COUNT(*) FROM quiz_participants WHERE quiz_id = $1',
      [quiz.id]
    );

    if (parseInt(participantCount.rows[0].count) >= quiz.max_participants) {
      return errorResponse('Quiz está cheio', 400);
    }

    // Verificar se já está participando
    const existingParticipant = await query(
      'SELECT id FROM quiz_participants WHERE quiz_id = $1 AND user_id = $2',
      [quiz.id, payload.userId]
    );

    if (existingParticipant.rows.length > 0) {
      return successResponse({
        message: 'Você já está participando deste quiz',
        participant_id: existingParticipant.rows[0].id,
        quiz,
      });
    }

    // Adicionar participante
    const result = await query(
      `INSERT INTO quiz_participants (quiz_id, user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [quiz.id, payload.userId]
    );

    return successResponse({
      message: 'Você entrou no quiz com sucesso',
      participant: result.rows[0],
      quiz,
    }, 201);
  } catch (error) {
    console.error('Join quiz error:', error);
    return errorResponse('Erro ao entrar no quiz', 500, error);
  }
};

export const start = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = extractToken(event.headers.Authorization || event.headers.authorization);
    if (!token) {
      return errorResponse('Token não fornecido', 401);
    }

    const payload = verifyToken(token);
    const quizId = event.pathParameters?.id;

    if (!quizId) {
      return errorResponse('ID do quiz não fornecido', 400);
    }

    // Verificar se é o criador
    const quizResult = await query(
      'SELECT * FROM quizzes WHERE id = $1 AND creator_id = $2',
      [quizId, payload.userId]
    );

    if (quizResult.rows.length === 0) {
      return errorResponse('Quiz não encontrado ou você não tem permissão', 403);
    }

    // Atualizar status do quiz
    const result = await query(
      `UPDATE quizzes
       SET status = 'in_progress', started_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [quizId]
    );

    // Criar sessão de sincronização
    const firstQuestion = await query(
      'SELECT * FROM questions WHERE quiz_id = $1 ORDER BY question_order LIMIT 1',
      [quizId]
    );

    if (firstQuestion.rows.length > 0) {
      const question = firstQuestion.rows[0];
      const questionEndsAt = new Date(Date.now() + question.time_limit * 1000);

      await query(
        `INSERT INTO sync_sessions (quiz_id, current_question_id, question_started_at, question_ends_at, status)
         VALUES ($1, $2, CURRENT_TIMESTAMP, $3, 'question_active')`,
        [quizId, question.id, questionEndsAt]
      );
    }

    return successResponse(result.rows[0]);
  } catch (error) {
    console.error('Start quiz error:', error);
    return errorResponse('Erro ao iniciar quiz', 500, error);
  }
};
