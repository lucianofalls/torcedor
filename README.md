# Torcida Quiz App

Aplicativo de quiz online para Android e iOS, com sistema de sincronização em tempo real, preparado para evolução futura como aplicativo de torcedor com mensalidades e notificações.

## Arquitetura

### Backend
- **Framework**: Node.js + TypeScript
- **Deploy**: AWS Lambda (serverless)
- **Banco de Dados**: PostgreSQL
- **API**: REST + WebSocket (tempo real)

### Mobile
- **Framework**: React Native (Expo)
- **Plataformas**: iOS e Android
- **State Management**: Context API
- **Autenticação**: JWT

### Database
- PostgreSQL 15
- Docker para desenvolvimento local

## Estrutura do Projeto

```
torcida/
├── backend/                 # Backend Node.js/TypeScript
│   ├── src/
│   │   ├── config/         # Configurações (database, etc)
│   │   ├── handlers/       # Lambda handlers
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utilitários
│   ├── package.json
│   ├── serverless.yml      # Configuração AWS Lambda
│   └── tsconfig.json
│
├── mobile/                  # App React Native
│   ├── src/
│   │   ├── contexts/       # Context API (Auth, etc)
│   │   ├── navigation/     # React Navigation
│   │   ├── screens/        # Telas do app
│   │   ├── types/          # TypeScript types
│   │   └── config/         # Configurações (API)
│   ├── package.json
│   ├── app.json            # Configuração Expo
│   └── tsconfig.json
│
├── database/                # Scripts SQL
│   └── init/
│       ├── 01-schema.sql   # Schema do banco
│       └── 02-seed.sql     # Dados de exemplo
│
└── docker-compose.yml       # PostgreSQL local
```

## Funcionalidades Implementadas

### Quiz
- ✅ Criação de quiz com múltiplas perguntas
- ✅ Código único para compartilhar (6 caracteres)
- ✅ Limite de participantes configurável
- ✅ Timer por pergunta
- ✅ Sistema de pontuação (baseado em acertos e velocidade)
- ✅ Ranking em tempo real
- ✅ Sincronização entre participantes

### Autenticação
- ✅ Login/Registro
- ✅ JWT Token
- ✅ Planos (free/premium)

### Administração
- ✅ Criar e gerenciar quizzes
- ✅ Adicionar perguntas e opções
- ✅ Iniciar quiz
- ✅ Visualizar ranking

## Funcionalidades Futuras (Preparadas no DB)

### Torcedor
- 🔜 Associação a times de futebol
- 🔜 Mensalidades
- 🔜 Sistema de pagamentos
- 🔜 Notificações push
- 🔜 Relatórios de pagamentos

## Como Executar

### 1. Subir o PostgreSQL

```bash
docker-compose up -d
```

O banco de dados estará disponível em `localhost:5432`:
- **Database**: torcida_db
- **User**: torcida_user
- **Password**: torcida_pass_2024

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

O backend estará rodando em `http://localhost:3000`

### 3. Mobile

```bash
cd mobile
npm install
npx expo start
```

Escaneie o QR code com o app Expo Go (iOS/Android)

## Credenciais de Teste

```
Email: admin@torcida.com
Senha: admin123
```

## API Endpoints

### Autenticação
- `POST /auth/login` - Login
- `POST /auth/register` - Registrar

### Quiz
- `GET /quizzes` - Listar meus quizzes
- `POST /quizzes` - Criar quiz
- `GET /quizzes/:id` - Detalhes do quiz
- `POST /quizzes/:code/join` - Entrar no quiz
- `POST /quizzes/:id/start` - Iniciar quiz

### Perguntas
- `POST /quizzes/:quizId/questions` - Adicionar pergunta

### Respostas
- `POST /quizzes/:quizId/answers` - Enviar resposta

### Ranking
- `GET /quizzes/:quizId/leaderboard` - Ver ranking

## Deploy

### Backend (AWS Lambda)

1. Configure as credenciais AWS:
```bash
aws configure
```

2. Configure as variáveis de ambiente no `.env`

3. Deploy:
```bash
cd backend
npm run deploy:prod
```

### Database (RDS)

1. Crie uma instância PostgreSQL no RDS
2. Execute os scripts de `database/init/` no RDS
3. Atualize as variáveis de ambiente do Lambda

### Mobile

```bash
cd mobile
eas build --platform android
eas build --platform ios
eas submit
```

## Escalabilidade

- **50+ participantes**: Upgrade do plano para Premium
- **Sincronização**: WebSocket para updates em tempo real
- **Performance**: Lambda auto-scaling
- **Database**: RDS com réplicas de leitura

## Tecnologias Utilizadas

- **Backend**: Node.js, TypeScript, Express, Serverless Framework
- **Mobile**: React Native, Expo, React Navigation
- **Database**: PostgreSQL
- **Auth**: JWT, bcrypt
- **Cloud**: AWS Lambda, AWS RDS
- **Real-time**: WebSocket

## Roadmap

### Fase 1 (Atual) ✅
- Sistema de quiz funcional
- Autenticação
- Ranking

### Fase 2 (Próxima) 🔜
- WebSocket real-time sync
- Notificações push
- Times de futebol

### Fase 3 🔜
- Sistema de pagamentos (Stripe/PagSeguro)
- Mensalidades recorrentes
- Relatórios financeiros

### Fase 4 🔜
- Chat entre torcedores
- Feed de notícias
- Integração com redes sociais

## Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT.

## Suporte

Para suporte, entre em contato através do email: suporte@torcida.com
