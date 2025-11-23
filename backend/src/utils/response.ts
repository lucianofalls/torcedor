export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export const successResponse = (data: any, statusCode = 200): ApiResponse => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
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
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: JSON.stringify({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    }),
  };
};
