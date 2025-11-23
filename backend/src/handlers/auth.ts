import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { generateToken } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';

export const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Email e senha são obrigatórios', 400);
    }

    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return errorResponse('Credenciais inválidas', 401);
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return errorResponse('Credenciais inválidas', 401);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return successResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan_type: user.plan_type,
        max_participants: user.max_participants,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Erro ao fazer login', 500, error);
  }
};

export const register = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password, name, phone } = body;

    if (!email || !password || !name) {
      return errorResponse('Email, senha e nome são obrigatórios', 400);
    }

    // Verificar se o email já existe
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return errorResponse('Email já cadastrado', 400);
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário
    const result = await query(
      `INSERT INTO users (email, password_hash, name, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, plan_type, max_participants`,
      [email, passwordHash, name, phone]
    );

    const user = result.rows[0];

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return successResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan_type: user.plan_type,
        max_participants: user.max_participants,
      },
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse('Erro ao registrar usuário', 500, error);
  }
};
