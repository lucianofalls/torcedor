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
    const { title, description, max_participants = 50, time_limit = 30 } = body;

    if (!title) {
      return errorResponse('Título é obrigatório', 400);
    }

    const code = generateQuizCode();

    const result = await query(
      `INSERT INTO quizzes (creator_id, title, description, code, max_participants, status, time_limit)
       VALUES ($1, $2, $3, $4, $5, 'draft', $6)
       RETURNING *`,
      [payload.userId, title, description, code, max_participants, time_limit]
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
    // Permitir acesso com ou sem token (autenticado ou anônimo)
    const token = extractToken(event.headers.Authorization || event.headers.authorization);
    if (token) {
      verifyToken(token); // Validate token if provided
    }

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
           'option_order', o.option_order,
           'is_correct', o.is_correct
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

    console.log('📋 QUIZ DETAILS:', { id: quiz.id, title: quiz.title, status: quiz.status, questionCount: quiz.questions.length });

    return successResponse(quiz);
  } catch (error) {
    console.error('Get quiz error:', error);
    return errorResponse('Erro ao buscar quiz', 500, error);
  }
};

export const join = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const code = event.pathParameters?.code;

    if (!code) {
      return errorResponse('Código do quiz não fornecido', 400);
    }

    // Parse body to get CPF and name (for anonymous users)
    const body = event.body ? JSON.parse(event.body) : {};
    const { cpf, participant_name } = body;

    // Check if it's anonymous participation (has CPF and name) or authenticated
    const token = extractToken(event.headers.Authorization || event.headers.authorization);
    const isAnonymous = !token && cpf && participant_name;
    const isAuthenticated = !!token;

    if (!isAnonymous && !isAuthenticated) {
      return errorResponse('Forneça o token de autenticação OU CPF e nome para participar', 401);
    }

    // For anonymous users, validate CPF
    if (isAnonymous) {
      const { validateCPF, cleanCPF } = await import('../utils/cpf-validator');
      const cleanedCPF = cleanCPF(cpf);

      if (!validateCPF(cleanedCPF)) {
        return errorResponse('CPF inválido', 400);
      }

      if (!participant_name || participant_name.trim().length < 3) {
        return errorResponse('Nome deve ter pelo menos 3 caracteres', 400);
      }
    }

    let userId = null;
    if (isAuthenticated) {
      const payload = verifyToken(token);
      userId = payload.userId;
    }

    // Buscar quiz pelo código (aceita active ou in_progress)
    const quizResult = await query(
      `SELECT * FROM quizzes WHERE code = $1 AND status IN ('active', 'in_progress')`,
      [code]
    );

    if (quizResult.rows.length === 0) {
      return errorResponse('Quiz não encontrado ou não está disponível', 404);
    }

    const quiz = quizResult.rows[0];

    // Se o quiz está em progresso, verificar se o tempo total já expirou
    if (quiz.status === 'in_progress' && quiz.started_at) {
      // Calcular tempo total: time_limit do quiz * número de perguntas
      const questionCountResult = await query(
        'SELECT COUNT(*) as question_count FROM questions WHERE quiz_id = $1',
        [quiz.id]
      );
      const questionCount = parseInt(questionCountResult.rows[0].question_count) || 0;
      const totalTimeSeconds = (quiz.time_limit || 30) * questionCount;

      // Calcular se o tempo expirou
      const startedAt = new Date(quiz.started_at);
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

      // Adicionar margem de 30 segundos para transições entre perguntas
      const totalTimeWithMargin = totalTimeSeconds + 30;

      if (elapsedSeconds > totalTimeWithMargin) {
        // Tempo expirado - retornar info para redirecionar ao ranking
        return successResponse({
          message: 'O tempo deste quiz já expirou',
          quiz,
          timeExpired: true,
          canContinue: false,
        });
      }
    }

    // Verificar número de participantes
    const participantCount = await query(
      'SELECT COUNT(*) FROM quiz_participants WHERE quiz_id = $1',
      [quiz.id]
    );

    if (parseInt(participantCount.rows[0].count) >= quiz.max_participants) {
      return errorResponse('Quiz está cheio', 400);
    }

    // Verificar se já está participando e se já completou
    let existingParticipant;
    if (isAnonymous) {
      const { cleanCPF } = await import('../utils/cpf-validator');
      const cleanedCPF = cleanCPF(cpf);
      existingParticipant = await query(
        'SELECT id, completed_at FROM quiz_participants WHERE quiz_id = $1 AND cpf = $2',
        [quiz.id, cleanedCPF]
      );

      if (existingParticipant.rows.length > 0) {
        const participant = existingParticipant.rows[0];

        // Verificar se já completou o quiz
        if (participant.completed_at) {
          return errorResponse('Você já participou e completou este quiz', 400);
        }

        // Verificar se o tempo expirou para participantes já cadastrados
        let timeExpired = false;
        if (quiz.status === 'in_progress' && quiz.started_at) {
          const questionCountResult = await query(
            'SELECT COUNT(*) as question_count FROM questions WHERE quiz_id = $1',
            [quiz.id]
          );
          const questionCount = parseInt(questionCountResult.rows[0].question_count) || 0;
          const totalTimeSeconds = (quiz.time_limit || 30) * questionCount;
          const startedAt = new Date(quiz.started_at);
          const now = new Date();
          const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
          const totalTimeWithMargin = totalTimeSeconds + 30;

          if (elapsedSeconds > totalTimeWithMargin) {
            timeExpired = true;
          }
        }

        // Já está participando mas não completou - pode continuar jogando se tempo não expirou
        return successResponse({
          message: timeExpired ? 'O tempo deste quiz já expirou' : 'Você já está participando deste quiz',
          participant_id: participant.id,
          quiz,
          canContinue: !timeExpired,
          timeExpired,
        });
      }
    } else {
      existingParticipant = await query(
        'SELECT id, completed_at FROM quiz_participants WHERE quiz_id = $1 AND user_id = $2',
        [quiz.id, userId]
      );

      if (existingParticipant.rows.length > 0) {
        const participant = existingParticipant.rows[0];

        // Verificar se já completou o quiz
        if (participant.completed_at) {
          return errorResponse('Você já participou e completou este quiz', 400);
        }

        // Verificar se o tempo expirou para participantes já cadastrados
        let timeExpired = false;
        if (quiz.status === 'in_progress' && quiz.started_at) {
          const questionCountResult = await query(
            'SELECT COUNT(*) as question_count FROM questions WHERE quiz_id = $1',
            [quiz.id]
          );
          const questionCount = parseInt(questionCountResult.rows[0].question_count) || 0;
          const totalTimeSeconds = (quiz.time_limit || 30) * questionCount;
          const startedAt = new Date(quiz.started_at);
          const now = new Date();
          const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
          const totalTimeWithMargin = totalTimeSeconds + 30;

          if (elapsedSeconds > totalTimeWithMargin) {
            timeExpired = true;
          }
        }

        // Já está participando mas não completou - pode continuar jogando se tempo não expirou
        return successResponse({
          message: timeExpired ? 'O tempo deste quiz já expirou' : 'Você já está participando deste quiz',
          participant_id: participant.id,
          quiz,
          canContinue: !timeExpired,
          timeExpired,
        });
      }
    }

    // Adicionar participante
    let result;
    if (isAnonymous) {
      const { cleanCPF } = await import('../utils/cpf-validator');
      const cleanedCPF = cleanCPF(cpf);
      result = await query(
        `INSERT INTO quiz_participants (quiz_id, cpf, participant_name)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [quiz.id, cleanedCPF, participant_name.trim()]
      );
    } else {
      result = await query(
        `INSERT INTO quiz_participants (quiz_id, user_id)
         VALUES ($1, $2)
         RETURNING *`,
        [quiz.id, userId]
      );
    }

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

export const update = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

    const body = JSON.parse(event.body || '{}');
    const { title, description, max_participants, time_limit } = body;

    if (!title) {
      return errorResponse('Título é obrigatório', 400);
    }

    // Verificar se é o criador e se o quiz está ativo
    const quizResult = await query(
      'SELECT * FROM quizzes WHERE id = $1 AND creator_id = $2',
      [quizId, payload.userId]
    );

    if (quizResult.rows.length === 0) {
      return errorResponse('Quiz não encontrado ou você não tem permissão', 403);
    }

    const quiz = quizResult.rows[0];

    if (quiz.status !== 'draft' && quiz.status !== 'active') {
      return errorResponse('Quizzes em andamento ou finalizados não podem ser editados', 400);
    }

    // Atualizar quiz
    const result = await query(
      `UPDATE quizzes
       SET title = $1, description = $2, max_participants = $3, time_limit = COALESCE($4, time_limit), updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [title, description, max_participants, time_limit, quizId]
    );

    return successResponse(result.rows[0]);
  } catch (error) {
    console.error('Update quiz error:', error);
    return errorResponse('Erro ao atualizar quiz', 500, error);
  }
};

export const remove = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

    const quiz = quizResult.rows[0];

    if (quiz.status !== 'draft' && quiz.status !== 'active') {
      return errorResponse('Quizzes em andamento ou finalizados não podem ser excluídos', 400);
    }

    // Deletar quiz (cascade vai deletar perguntas, opções, participantes, etc)
    await query('DELETE FROM quizzes WHERE id = $1', [quizId]);

    return successResponse({ message: 'Quiz excluído com sucesso' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    return errorResponse('Erro ao excluir quiz', 500, error);
  }
};

export const getParticipantQuizzes = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const cpf = event.pathParameters?.cpf;

    if (!cpf) {
      return errorResponse('CPF não fornecido', 400);
    }

    // Validar CPF
    const { validateCPF, cleanCPF } = await import('../utils/cpf-validator');
    const cleanedCPF = cleanCPF(cpf);

    if (!validateCPF(cleanedCPF)) {
      return errorResponse('CPF inválido', 400);
    }

    // Buscar todos os quizzes que este CPF participou, incluindo completed_at, tempo do quiz e perguntas respondidas
    const result = await query(
      `SELECT
        q.id,
        q.title,
        q.description,
        q.code,
        q.status,
        q.started_at,
        q.created_at,
        q.time_limit,
        qp.completed_at,
        qp.id as participant_id,
        (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count,
        (SELECT COUNT(*) FROM quiz_participants WHERE quiz_id = q.id) as participant_count,
        (SELECT COUNT(*) FROM participant_answers WHERE participant_id = qp.id) as answered_questions
       FROM quizzes q
       JOIN quiz_participants qp ON q.id = qp.quiz_id
       WHERE qp.cpf = $1
       ORDER BY q.created_at DESC`,
      [cleanedCPF]
    );

    // Adicionar informação de status para cada quiz
    const quizzes = result.rows.map(quiz => {
      let canPlay = false;
      let statusMessage = '';
      const isCompleted = !!quiz.completed_at;
      let timeExpired = false;

      // Verificar se o tempo do quiz expirou (para quizzes em andamento)
      if (quiz.status === 'in_progress' && quiz.started_at && !isCompleted) {
        const questionCount = parseInt(quiz.question_count) || 0;
        const totalTimeSeconds = (quiz.time_limit || 30) * questionCount;
        const startedAt = new Date(quiz.started_at);
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
        // Margem de 30 segundos para transições entre perguntas
        const totalTimeWithMargin = totalTimeSeconds + 30;

        if (elapsedSeconds > totalTimeWithMargin) {
          timeExpired = true;
        }
      }

      if (isCompleted) {
        // Participante já completou este quiz - NÃO pode jogar novamente
        statusMessage = 'Concluído';
        canPlay = false;
      } else if (timeExpired) {
        // Tempo do quiz expirou - NÃO pode jogar, deve ver ranking
        statusMessage = 'Tempo expirado';
        canPlay = false;
      } else if (quiz.status === 'active' && !quiz.started_at) {
        statusMessage = 'Aguardando início';
        canPlay = false;
      } else if (quiz.status === 'in_progress') {
        statusMessage = 'Em andamento';
        canPlay = true;
      } else if (quiz.status === 'finished') {
        statusMessage = 'Finalizado';
        canPlay = false;
      }

      return {
        ...quiz,
        canPlay,
        statusMessage,
        isCompleted,
        timeExpired,
        answeredQuestions: parseInt(quiz.answered_questions) || 0,
      };
    });

    return successResponse(quizzes);
  } catch (error) {
    console.error('Get participant quizzes error:', error);
    return errorResponse('Erro ao buscar quizzes do participante', 500, error);
  }
};

export const getQuizStatus = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const quizId = event.pathParameters?.id;

    if (!quizId) {
      return errorResponse('ID do quiz não fornecido', 400);
    }

    const result = await query(
      `SELECT
        id,
        title,
        description,
        status,
        started_at,
        created_at
       FROM quizzes
       WHERE id = $1`,
      [quizId]
    );

    if (result.rows.length === 0) {
      return errorResponse('Quiz não encontrado', 404);
    }

    const quiz = result.rows[0];

    return successResponse({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      status: quiz.status,
      started_at: quiz.started_at,
      created_at: quiz.created_at,
    });
  } catch (error) {
    console.error('Get quiz status error:', error);
    return errorResponse('Erro ao buscar status do quiz', 500, error);
  }
};

export const activate = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

    // Verificar se é o criador e se o quiz está em draft
    const quizResult = await query(
      'SELECT * FROM quizzes WHERE id = $1 AND creator_id = $2',
      [quizId, payload.userId]
    );

    if (quizResult.rows.length === 0) {
      return errorResponse('Quiz não encontrado ou você não tem permissão', 403);
    }

    const quiz = quizResult.rows[0];

    if (quiz.status !== 'draft') {
      return errorResponse('Quiz já foi ativado', 400);
    }

    // Atualizar status para active
    const result = await query(
      `UPDATE quizzes
       SET status = 'active'
       WHERE id = $1
       RETURNING *`,
      [quizId]
    );

    return successResponse(result.rows[0]);
  } catch (error) {
    console.error('Activate quiz error:', error);
    return errorResponse('Erro ao ativar quiz', 500, error);
  }
};

export const finish = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

    // Atualizar status para finished
    const result = await query(
      `UPDATE quizzes
       SET status = 'finished'
       WHERE id = $1
       RETURNING *`,
      [quizId]
    );

    return successResponse(result.rows[0]);
  } catch (error) {
    console.error('Finish quiz error:', error);
    return errorResponse('Erro ao finalizar quiz', 500, error);
  }
};

export const getProgress = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const quizId = event.pathParameters?.id;
    const cpf = event.queryStringParameters?.cpf;

    if (!quizId) {
      return errorResponse('ID do quiz não fornecido', 400);
    }

    if (!cpf) {
      return errorResponse('CPF não fornecido', 400);
    }

    // Validar e limpar CPF
    const { validateCPF, cleanCPF } = await import('../utils/cpf-validator');
    const cleanedCPF = cleanCPF(cpf);

    if (!validateCPF(cleanedCPF)) {
      return errorResponse('CPF inválido', 400);
    }

    // Buscar o quiz com informações de tempo
    const quizResult = await query(
      `SELECT
        q.id,
        q.status,
        q.started_at,
        q.time_limit,
        (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count
       FROM quizzes q
       WHERE q.id = $1`,
      [quizId]
    );

    if (quizResult.rows.length === 0) {
      return errorResponse('Quiz não encontrado', 404);
    }

    const quiz = quizResult.rows[0];

    // Verificar se o tempo total do quiz expirou
    let timeExpired = false;
    if (quiz.status === 'in_progress' && quiz.started_at) {
      const questionCount = parseInt(quiz.question_count) || 0;
      const totalTimeSeconds = (quiz.time_limit || 30) * questionCount;
      const startedAt = new Date(quiz.started_at);
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
      // Margem de 30 segundos para transições entre perguntas
      const totalTimeWithMargin = totalTimeSeconds + 30;

      if (elapsedSeconds > totalTimeWithMargin) {
        timeExpired = true;
      }
    }

    // Se o tempo expirou, retornar erro
    if (timeExpired) {
      return errorResponse('O tempo do quiz expirou', 410, { timeExpired: true });
    }

    // Verificar se o quiz está em andamento
    if (quiz.status !== 'in_progress') {
      return errorResponse('Quiz não está em andamento', 400, { status: quiz.status });
    }

    // Buscar o participante
    const participantResult = await query(
      'SELECT id, total_score, completed_at FROM quiz_participants WHERE quiz_id = $1 AND cpf = $2',
      [quizId, cleanedCPF]
    );

    if (participantResult.rows.length === 0) {
      return errorResponse('Participante não encontrado neste quiz', 404);
    }

    const participant = participantResult.rows[0];

    // Verificar se o participante já completou o quiz
    if (participant.completed_at) {
      return errorResponse('Você já completou este quiz', 400, { isCompleted: true });
    }

    // Buscar todas as perguntas do quiz ordenadas
    const questionsResult = await query(
      'SELECT id, question_order FROM questions WHERE quiz_id = $1 ORDER BY question_order',
      [quizId]
    );

    if (questionsResult.rows.length === 0) {
      return errorResponse('Quiz não possui perguntas', 404);
    }

    // Buscar as perguntas já respondidas por este participante
    const answeredResult = await query(
      'SELECT question_id FROM participant_answers WHERE participant_id = $1',
      [participant.id]
    );

    const answeredQuestionIds = answeredResult.rows.map(row => row.question_id);

    // Encontrar o índice da primeira pergunta não respondida
    let nextQuestionIndex = 0;
    for (let i = 0; i < questionsResult.rows.length; i++) {
      if (!answeredQuestionIds.includes(questionsResult.rows[i].id)) {
        nextQuestionIndex = i;
        break;
      }
      // Se todas foram respondidas, vai para além do último índice
      if (i === questionsResult.rows.length - 1) {
        nextQuestionIndex = questionsResult.rows.length;
      }
    }

    // Calcular tempo restante do quiz
    const totalQuestionCount = parseInt(quiz.question_count) || 0;
    const totalTimeSecondsForQuiz = (quiz.time_limit || 30) * totalQuestionCount;
    const startedAt = new Date(quiz.started_at);
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    const remainingSeconds = Math.max(0, totalTimeSecondsForQuiz + 30 - elapsedSeconds);

    return successResponse({
      participantId: participant.id,
      currentScore: participant.total_score || 0,
      totalQuestions: questionsResult.rows.length,
      answeredQuestions: answeredQuestionIds.length,
      nextQuestionIndex,
      isCompleted: answeredQuestionIds.length >= questionsResult.rows.length,
      timeExpired: false,
      remainingSeconds,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return errorResponse('Erro ao buscar progresso', 500, error);
  }
};
