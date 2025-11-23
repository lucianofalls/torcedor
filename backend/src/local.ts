import express from 'express';
import cors from 'cors';
import * as authHandlers from './handlers/auth';
import * as quizHandlers from './handlers/quiz';
import * as questionHandlers from './handlers/question';
import * as answerHandlers from './handlers/answer';
import * as leaderboardHandlers from './handlers/leaderboard';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Middleware para simular o evento do API Gateway
const createLambdaEvent = (req: express.Request): any => {
  return {
    body: JSON.stringify(req.body),
    headers: req.headers,
    pathParameters: req.params,
    queryStringParameters: req.query,
  };
};

// Rotas de autenticação
app.post('/auth/login', async (req, res) => {
  const event = createLambdaEvent(req);
  const result = await authHandlers.login(event as any);
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.post('/auth/register', async (req, res) => {
  const event = createLambdaEvent(req);
  const result = await authHandlers.register(event as any);
  res.status(result.statusCode).json(JSON.parse(result.body));
});

// Rotas de quiz
app.post('/quizzes', async (req, res) => {
  const event = createLambdaEvent(req);
  const result = await quizHandlers.create(event as any);
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.get('/quizzes', async (req, res) => {
  const event = createLambdaEvent(req);
  const result = await quizHandlers.list(event as any);
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.get('/quizzes/:id', async (req, res) => {
  const event = createLambdaEvent(req);
  const result = await quizHandlers.get(event as any);
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.post('/quizzes/:code/join', async (req, res) => {
  const event = createLambdaEvent(req);
  const result = await quizHandlers.join(event as any);
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.post('/quizzes/:id/start', async (req, res) => {
  const event = createLambdaEvent(req);
  const result = await quizHandlers.start(event as any);
  res.status(result.statusCode).json(JSON.parse(result.body));
});

// Rotas de perguntas
app.post('/quizzes/:quizId/questions', async (req, res) => {
  const event = createLambdaEvent(req);
  const result = await questionHandlers.add(event as any);
  res.status(result.statusCode).json(JSON.parse(result.body));
});

// Rotas de respostas
app.post('/quizzes/:quizId/answers', async (req, res) => {
  const event = createLambdaEvent(req);
  const result = await answerHandlers.submit(event as any);
  res.status(result.statusCode).json(JSON.parse(result.body));
});

// Rotas de ranking
app.get('/quizzes/:quizId/leaderboard', async (req, res) => {
  const event = createLambdaEvent(req);
  const result = await leaderboardHandlers.get(event as any);
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Network: http://192.168.0.121:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
});
