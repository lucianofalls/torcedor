import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { query } from '../config/database';
import { successResponse, errorResponse } from '../utils/response';

export const get = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Autenticação opcional - permite usuários anônimos verem o ranking
    const quizId = event.pathParameters?.quizId;

    if (!quizId) {
      return errorResponse('ID do quiz não fornecido', 400);
    }

    // Buscar ranking - suporta tanto usuários autenticados quanto anônimos
    // Agora retorna o CPF para identificação única
    const result = await query(
      `SELECT
         COALESCE(qp.user_id::text, qp.cpf) as user_id,
         COALESCE(u.name, qp.participant_name) as user_name,
         qp.cpf,
         qp.total_score,
         qp.total_time_ms,
         COUNT(pa.id) FILTER (WHERE pa.is_correct = true) as correct_answers,
         COUNT(pa.id) as total_answered,
         (SELECT COUNT(*) FROM questions WHERE quiz_id = $1) as total_questions,
         ROW_NUMBER() OVER (ORDER BY qp.total_score DESC, qp.total_time_ms ASC) as position
       FROM quiz_participants qp
       LEFT JOIN users u ON qp.user_id = u.id
       LEFT JOIN participant_answers pa ON pa.participant_id = qp.id
       WHERE qp.quiz_id = $1
       GROUP BY qp.id, qp.user_id, qp.cpf, qp.participant_name, u.name, qp.total_score, qp.total_time_ms
       ORDER BY qp.total_score DESC, qp.total_time_ms ASC`,
      [quizId]
    );

    return successResponse(result.rows);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return errorResponse('Erro ao buscar ranking', 500, error);
  }
};
