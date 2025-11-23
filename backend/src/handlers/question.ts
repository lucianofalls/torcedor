import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { query } from '../config/database';
import { extractToken, verifyToken } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';

export const add = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = extractToken(event.headers.Authorization || event.headers.authorization);
    if (!token) {
      return errorResponse('Token não fornecido', 401);
    }

    const payload = verifyToken(token);
    const quizId = event.pathParameters?.quizId;
    const body = JSON.parse(event.body || '{}');

    if (!quizId) {
      return errorResponse('ID do quiz não fornecido', 400);
    }

    const { question_text, time_limit, options, points = 100 } = body;

    if (!question_text || !time_limit || !options || options.length < 2) {
      return errorResponse('Dados da pergunta incompletos', 400);
    }

    // Verificar se é o criador do quiz
    const quizResult = await query(
      'SELECT * FROM quizzes WHERE id = $1 AND creator_id = $2',
      [quizId, payload.userId]
    );

    if (quizResult.rows.length === 0) {
      return errorResponse('Quiz não encontrado ou você não tem permissão', 403);
    }

    // Obter próxima ordem
    const orderResult = await query(
      'SELECT COALESCE(MAX(question_order), 0) + 1 as next_order FROM questions WHERE quiz_id = $1',
      [quizId]
    );

    const questionOrder = orderResult.rows[0].next_order;

    // Inserir pergunta
    const questionResult = await query(
      `INSERT INTO questions (quiz_id, question_text, question_order, time_limit, points)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [quizId, question_text, questionOrder, time_limit, points]
    );

    const question = questionResult.rows[0];

    // Inserir opções
    const optionsPromises = options.map((option: any, index: number) => {
      return query(
        `INSERT INTO options (question_id, option_text, option_order, is_correct)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [question.id, option.text, index + 1, option.is_correct || false]
      );
    });

    const optionsResults = await Promise.all(optionsPromises);
    question.options = optionsResults.map(result => result.rows[0]);

    return successResponse(question, 201);
  } catch (error) {
    console.error('Add question error:', error);
    return errorResponse('Erro ao adicionar pergunta', 500, error);
  }
};
