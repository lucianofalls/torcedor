# Arquitetura do Sistema

## Visão Geral

O sistema é dividido em 3 camadas principais:

```
┌─────────────────┐
│   Mobile App    │  React Native / Expo
│  (iOS/Android)  │
└────────┬────────┘
         │ REST API / WebSocket
         │
┌────────▼────────┐
│   Backend API   │  Node.js / AWS Lambda
│   (Serverless)  │
└────────┬────────┘
         │ SQL
         │
┌────────▼────────┐
│   PostgreSQL    │  Database
│     (RDS)       │
└─────────────────┘
```

## Componentes

### 1. Mobile App (React Native / Expo)

**Responsabilidades:**
- Interface do usuário
- Autenticação local (JWT storage)
- Consumo da API REST
- Conexão WebSocket para real-time

**Estrutura:**
```
mobile/
├── src/
│   ├── contexts/          # State management
│   │   └── AuthContext.tsx
│   ├── navigation/        # Stack navigation
│   │   └── AppNavigator.tsx
│   ├── screens/           # Telas
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── CreateQuizScreen.tsx
│   │   ├── PlayQuizScreen.tsx
│   │   └── LeaderboardScreen.tsx
│   ├── config/            # Configurações
│   │   └── api.ts
│   └── types/             # TypeScript types
```

**Tecnologias:**
- React Native 0.73
- Expo SDK 50
- React Navigation 6
- Axios
- AsyncStorage

### 2. Backend (Node.js / AWS Lambda)

**Responsabilidades:**
- API REST
- Autenticação JWT
- Lógica de negócio
- Gerenciamento de quiz
- Sistema de pontuação
- WebSocket para sincronização

**Estrutura:**
```
backend/
├── src/
│   ├── handlers/          # Lambda handlers
│   │   ├── auth.ts        # Login/Register
│   │   ├── quiz.ts        # CRUD Quiz
│   │   ├── question.ts    # Add Questions
│   │   ├── answer.ts      # Submit Answers
│   │   ├── leaderboard.ts # Rankings
│   │   └── websocket.ts   # Real-time sync
│   ├── config/
│   │   └── database.ts    # DB connection pool
│   ├── utils/
│   │   ├── jwt.ts         # Auth utilities
│   │   ├── response.ts    # API responses
│   │   └── codeGenerator.ts
│   └── types/             # TypeScript types
```

**Tecnologias:**
- Node.js 18
- TypeScript
- Express (dev local)
- Serverless Framework
- pg (PostgreSQL client)
- bcryptjs
- jsonwebtoken

**Endpoints:**

```
Auth:
POST   /auth/login
POST   /auth/register

Quiz:
GET    /quizzes
POST   /quizzes
GET    /quizzes/:id
POST   /quizzes/:code/join
POST   /quizzes/:id/start

Questions:
POST   /quizzes/:quizId/questions

Answers:
POST   /quizzes/:quizId/answers

Leaderboard:
GET    /quizzes/:quizId/leaderboard

WebSocket:
CONNECT    $connect
DISCONNECT $disconnect
DEFAULT    $default
```

### 3. Database (PostgreSQL)

**Esquema:**

```sql
users                    # Usuários do sistema
├── id (uuid)
├── email
├── password_hash
├── name
├── role (admin/user)
├── plan_type (free/premium)
└── max_participants

quizzes                  # Quizzes criados
├── id (uuid)
├── creator_id → users
├── title
├── code (6 chars)
├── status (draft/active/in_progress/finished)
└── max_participants

questions                # Perguntas do quiz
├── id (uuid)
├── quiz_id → quizzes
├── question_text
├── question_order
├── time_limit (seconds)
└── points

options                  # Opções de resposta
├── id (uuid)
├── question_id → questions
├── option_text
├── option_order
└── is_correct

quiz_participants        # Participantes do quiz
├── id (uuid)
├── quiz_id → quizzes
├── user_id → users
├── total_score
└── total_time_ms

participant_answers      # Respostas enviadas
├── id (uuid)
├── participant_id → quiz_participants
├── question_id → questions
├── option_id → options
├── time_taken_ms
├── is_correct
└── points_earned

sync_sessions           # Sincronização real-time
├── id (uuid)
├── quiz_id → quizzes
├── current_question_id
├── question_started_at
└── status

-- Tabelas futuras --
teams                   # Times de futebol
fan_teams              # Associação torcedor-time
payments               # Pagamentos
notifications          # Notificações push
```

## Fluxo de Dados

### 1. Criação de Quiz

```
User → Mobile
       ↓
    POST /quizzes
       ↓
    Lambda Handler (quiz.create)
       ↓
    INSERT INTO quizzes
    RETURN quiz_id, code
       ↓
    POST /quizzes/:id/questions (N vezes)
       ↓
    INSERT INTO questions, options
       ↓
    Mobile exibe código para compartilhar
```

### 2. Entrada no Quiz

```
User digita código → Mobile
       ↓
    POST /quizzes/:code/join
       ↓
    Lambda Handler (quiz.join)
       ↓
    SELECT quiz WHERE code = ?
    CHECK participant_count < max_participants
    INSERT INTO quiz_participants
       ↓
    RETURN quiz_info
       ↓
    Mobile aguarda início
```

### 3. Jogar Quiz (Real-time)

```
Admin inicia quiz → POST /quizzes/:id/start
       ↓
    UPDATE quiz SET status = 'in_progress'
    INSERT INTO sync_sessions
       ↓
    WebSocket broadcast → Todos participantes
       ↓
    Mobile carrega primeira pergunta
       ↓
    Timer inicia
       ↓
User seleciona opção → POST /quizzes/:id/answers
       ↓
    INSERT INTO participant_answers
    UPDATE quiz_participants (score, time)
    CHECK is_correct
    CALCULATE points (baseado em tempo)
       ↓
    RETURN points_earned, is_correct
       ↓
    Mobile mostra resultado
    WebSocket broadcast → Atualiza leaderboard
       ↓
    Próxima pergunta...
```

### 4. Ranking

```
GET /quizzes/:id/leaderboard
       ↓
    SELECT participants
    JOIN users
    LEFT JOIN answers
    GROUP BY participant
    ORDER BY total_score DESC, total_time_ms ASC
       ↓
    RETURN ranked list
       ↓
    Mobile exibe ranking
```

## Sistema de Pontuação

**Fórmula:**
```
pontos_finais = pontos_base * fator_tempo

onde:
  pontos_base = 100 (se correto), 0 (se errado)
  fator_tempo = max(0, 1 - (tempo_gasto / tempo_limite) * 0.5)
```

**Exemplos:**
- Resposta correta em 10s (limite 30s): 100 * (1 - 10/30 * 0.5) = 83 pontos
- Resposta correta em 30s (limite 30s): 100 * (1 - 30/30 * 0.5) = 50 pontos
- Resposta errada: 0 pontos

**Ranking:**
1. Maior pontuação total
2. Em caso de empate: menor tempo total

## Segurança

### Autenticação
- Senhas com bcrypt (10 rounds)
- JWT tokens (7 dias de validade)
- Tokens armazenados localmente (AsyncStorage)

### Autorização
- Middleware de autenticação em todas as rotas protegidas
- Verificação de ownership (apenas criador pode gerenciar quiz)
- Rate limiting (futuro)

### Database
- Prepared statements (proteção contra SQL injection)
- Connection pooling
- SSL em produção (RDS)

## Escalabilidade

### Atual (MVP)
- AWS Lambda: Auto-scaling automático
- PostgreSQL: Single instance
- Limite: 50 participantes por quiz (plano free)

### Futuro
- Lambda: Sem mudanças necessárias
- RDS: Read replicas para queries pesadas
- ElastiCache: Cache de leaderboards
- CloudFront: CDN para assets
- SQS: Fila para notificações

## Monitoramento

### Logs
- CloudWatch Logs (Lambda)
- Structured logging (JSON)

### Métricas
- Lambda invocations
- API latency
- Database connections
- Error rate

### Alertas
- Lambda errors > threshold
- Database CPU > 80%
- API latency > 1s

## Deploy

### Desenvolvimento
```
Local PostgreSQL (Docker)
Local Express server
Expo Dev Client
```

### Staging
```
RDS PostgreSQL (dev)
Lambda (dev stage)
Expo Dev Build
```

### Produção
```
RDS PostgreSQL (prod + replicas)
Lambda (prod stage)
App Store / Play Store
```

## Custos Estimados (AWS)

### MVP (até 1000 usuários ativos)
- Lambda: ~$5/mês
- RDS t3.micro: ~$15/mês
- Data transfer: ~$5/mês
- **Total: ~$25/mês**

### Escala (10k usuários ativos)
- Lambda: ~$50/mês
- RDS t3.medium: ~$60/mês
- ElastiCache: ~$15/mês
- Data transfer: ~$25/mês
- **Total: ~$150/mês**

## Roadmap Técnico

### Fase 1 (Atual) ✅
- API REST completa
- Auth JWT
- Quiz CRUD
- Sistema de pontuação
- Ranking

### Fase 2 🔜
- WebSocket real-time sync
- Redis cache (ElastiCache)
- Push notifications (SNS)
- CI/CD (GitHub Actions)

### Fase 3 🔜
- Payments (Stripe)
- Recurring billing
- Admin dashboard
- Analytics

### Fase 4 🔜
- GraphQL API
- Microservices split
- Event-driven architecture (EventBridge)
- ML-based recommendations
