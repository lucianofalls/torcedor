export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

export const successResponse = (data: any, statusCode = 200): ApiResponse => {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      data,
    }),
  };
};

export const errorResponse = (message: string, statusCode = 400, error?: any): ApiResponse => {
  console.error('Error response:', { message, statusCode, error });

  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    }),
  };
};
