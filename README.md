# MinhaTorcida - Quiz App

Aplicativo de quiz online para Android e iOS, com sistema de sincronização em tempo real, preparado para evolução futura como aplicativo de torcedor com mensalidades e notificações.

## Arquitetura

### Backend
- **Framework**: Node.js + TypeScript
- **Deploy**: AWS Lambda (serverless)
- **Banco de Dados**: PostgreSQL (RDS)
- **API**: REST + WebSocket (tempo real)

### Mobile
- **Framework**: React Native (Expo)
- **Plataformas**: iOS e Android
- **State Management**: Context API
- **Autenticação**: JWT

### Infrastructure
- **Cloud**: AWS (Lambda, RDS, API Gateway, VPC)
- **IaC**: CloudFormation
- **CI/CD**: EAS Build/Submit

## Infraestrutura AWS - Produção

### VPC e Networking
- **VPC ID**: vpc-0414a43869d2b8a47
- **CIDR**: 10.0.0.0/16
- **Subnets**:
  - subnet-086c624f9f43be84d (10.0.1.0/24 - us-east-1a)
  - subnet-0f9c9c6f140a7c02f (10.0.2.0/24 - us-east-1b)
- **Security Group Lambda**: sg-0ea73082a8e6a1ccf

### RDS PostgreSQL
- **Host**: minhatorcida-db-prod.cwn39ruk7uza.us-east-1.rds.amazonaws.com
- **Porta**: 5432
- **Database**: torcida_db
- **Usuário**: torcida_user
- **Senha**: torcida_pass_2024
- **Instância**: db.t3.micro
- **Engine**: PostgreSQL 14.15
- **Connection String**:
  ```
  postgresql://torcida_user:torcida_pass_2024@minhatorcida-db-prod.cwn39ruk7uza.us-east-1.rds.amazonaws.com:5432/torcida_db
  ```

### API Gateway (Lambda)
- **REST API**: https://wtm7jm5p62.execute-api.us-east-1.amazonaws.com/prod
- **WebSocket**: wss://wwfnsw9wl0.execute-api.us-east-1.amazonaws.com/prod

### IAM
- **Lambda Role ARN**: arn:aws:iam::442133546524:role/minhatorcida-lambda-role-prod

## Apple/iOS - App Store

### Credenciais Apple
- **Apple ID**: luciano.falls@gmail.com
- **Team ID**: DW984UNWPP
- **App Store Connect App ID**: 6756377892
- **Bundle Identifier**: com.minhatorcida.app

### EAS (Expo Application Services)
- **Project ID**: c3786a23-011a-47d8-ac80-c5db0504de60
- **Owner**: luciano.falls
- **Slug**: minha-torcida

### Privacy Policy
- **URL**: https://lucianofalls.github.io/torcedor/privacy-policy.html

## Estrutura do Projeto

```
torcedor/
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
├── infrastructure/          # CloudFormation templates
│   └── cloudformation.yaml # VPC + RDS + IAM
│
└── docker-compose.yml       # PostgreSQL local (dev)
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

### Desenvolvimento Local

#### 1. Subir o PostgreSQL

```bash
docker-compose up -d
```

O banco de dados estará disponível em `localhost:5432`:
- **Database**: torcida_db
- **User**: torcida_user
- **Password**: torcida_pass_2024

#### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

O backend estará rodando em `http://localhost:3000`

#### 3. Mobile

```bash
cd mobile
npm install
npx expo start
```

Escaneie o QR code com o app Expo Go (iOS/Android)

### Produção (AWS)

O backend está deployado na AWS Lambda. Para atualizar:

```bash
cd backend
npm run deploy:prod
```

## Credenciais de Teste

### Admin
```
Email: admin@torcida.com
Senha: Instagram2023
```

## API Endpoints

Base URL: `https://wtm7jm5p62.execute-api.us-east-1.amazonaws.com/prod`

### Autenticação
- `POST /auth/login` - Login
- `POST /auth/register` - Registrar

### Quiz
- `GET /quizzes` - Listar meus quizzes
- `POST /quizzes` - Criar quiz
- `GET /quizzes/{quizId}` - Detalhes do quiz
- `POST /quizzes/join/{code}` - Entrar no quiz
- `POST /quizzes/{quizId}/start` - Iniciar quiz

### Perguntas
- `POST /quizzes/{quizId}/questions` - Adicionar pergunta

### Respostas
- `POST /quizzes/{quizId}/answers` - Enviar resposta

### Ranking
- `GET /quizzes/{quizId}/leaderboard` - Ver ranking

## Deploy

### Backend (AWS Lambda)

1. Configure as credenciais AWS:
```bash
aws configure
```

2. Configure as variáveis de ambiente no `serverless.yml`

3. Deploy:
```bash
cd backend
npx serverless deploy --stage prod
```

### Infrastructure (CloudFormation)

```bash
aws cloudformation create-stack \
  --stack-name minhatorcida-infra-prod \
  --template-body file://infrastructure/cloudformation.yaml \
  --capabilities CAPABILITY_NAMED_IAM
```

### Database

Conectar ao RDS e executar:
```bash
docker run --rm -e PGPASSWORD=torcida_pass_2024 postgres:15-alpine psql \
  -h minhatorcida-db-prod.cwn39ruk7uza.us-east-1.rds.amazonaws.com \
  -U torcida_user \
  -d torcida_db \
  -f /path/to/init.sql
```

### Mobile

#### Build
```bash
cd mobile
npx eas build --platform ios --profile production
npx eas build --platform android --profile production
```

#### Submit to App Store
```bash
npx eas submit --platform ios --latest
```

## Escalabilidade

- **50+ participantes**: Upgrade do plano para Premium
- **Sincronização**: WebSocket para updates em tempo real
- **Performance**: Lambda auto-scaling
- **Database**: RDS com réplicas de leitura

## Tecnologias Utilizadas

- **Backend**: Node.js, TypeScript, Serverless Framework
- **Mobile**: React Native, Expo, React Navigation
- **Database**: PostgreSQL
- **Auth**: JWT, bcrypt
- **Cloud**: AWS Lambda, AWS RDS, API Gateway, VPC
- **IaC**: CloudFormation
- **Real-time**: WebSocket
- **CI/CD**: EAS Build/Submit

## Roadmap

### Fase 1 (Atual) ✅
- Sistema de quiz funcional
- Autenticação
- Ranking
- Deploy AWS

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

Para suporte, entre em contato através do email: suporte@minhatorcida.com
