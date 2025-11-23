import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse } from '../utils/response';

export const connect = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('WebSocket connection established:', event.requestContext.connectionId);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Connected' }),
    };
  } catch (error) {
    console.error('WebSocket connect error:', error);
    return errorResponse('Erro ao conectar WebSocket', 500, error);
  }
};

export const disconnect = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('WebSocket disconnected:', event.requestContext.connectionId);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Disconnected' }),
    };
  } catch (error) {
    console.error('WebSocket disconnect error:', error);
    return errorResponse('Erro ao desconectar WebSocket', 500, error);
  }
};

export const default_ = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    console.log('WebSocket message received:', body);

    // Aqui você pode processar diferentes tipos de mensagens
    // Por exemplo: sincronização de questões, atualização de ranking em tempo real, etc.

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Message processed' }),
    };
  } catch (error) {
    console.error('WebSocket default error:', error);
    return errorResponse('Erro ao processar mensagem WebSocket', 500, error);
  }
};
