# Quick Start Guide

## Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- npm ou yarn
- Expo CLI (para mobile): `npm install -g expo-cli`
- Expo Go app (iOS/Android) para testar no celular

## Instalação Rápida

### 1. Iniciar o Banco de Dados

```bash
docker-compose up -d
```

Isso irá:
- Criar um container PostgreSQL
- Executar os scripts de schema e seed
- Banco disponível em `localhost:5432`

### 2. Configurar e Iniciar o Backend

```bash
cd backend
npm install
npm run dev
```

O backend estará em `http://localhost:3000`

### 3. Configurar e Iniciar o Mobile

Em outro terminal:

```bash
cd mobile
npm install
npx expo start
```

Use o Expo Go no seu celular para escanear o QR code.

## Testando o Aplicativo

### 1. Login
Use as credenciais de teste:
- **Email**: admin@torcida.com
- **Senha**: admin123

### 2. Criar um Quiz

1. Na tela inicial, clique em "Criar Quiz"
2. Preencha o título, descrição e número de participantes
3. Adicione pelo menos uma pergunta com:
   - Texto da pergunta
   - Tempo limite (em segundos)
   - Pelo menos 2 opções (marque uma como correta)
4. Clique em "Criar Quiz"

### 3. Entrar no Quiz (outro dispositivo/usuário)

1. Crie outra conta ou use outro dispositivo
2. Na tela inicial, clique em "Entrar em Quiz"
3. Digite o código do quiz (mostrado na tela do criador)
4. Aguarde o criador iniciar o quiz

### 4. Jogar o Quiz

1. Quando o criador iniciar, as perguntas aparecerão
2. Selecione uma opção antes do tempo acabar
3. Clique em "Confirmar"
4. Veja sua pontuação e passe para a próxima pergunta
5. Ao final, veja o ranking

## URLs Importantes

- **Backend**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Banco de Dados**: torcida_db
- **Usuário DB**: torcida_user
- **Senha DB**: torcida_pass_2024

## Estrutura de Pontuação

A pontuação é calculada baseada em:
- **Acerto**: 100 pontos base
- **Velocidade**: Quanto mais rápido responder, mais pontos
- **Fórmula**: `pontos = 100 * (1 - (tempo_gasto / tempo_limite) * 0.5)`

Exemplo:
- Tempo limite: 30 segundos
- Respondeu em 10 segundos: 100 * (1 - (10/30) * 0.5) = 83 pontos
- Respondeu em 20 segundos: 100 * (1 - (20/30) * 0.5) = 67 pontos

## Comandos Úteis

### Backend

```bash
# Desenvolvimento local
npm run dev

# Build
npm run build

# Deploy para AWS Lambda
npm run deploy:prod

# Testes
npm test
```

### Mobile

```bash
# Iniciar Expo
npx expo start

# Build Android
eas build --platform android

# Build iOS
eas build --platform ios

# Publicar
eas submit
```

### Database

```bash
# Acessar o PostgreSQL
docker exec -it torcida-postgres psql -U torcida_user -d torcida_db

# Parar o banco
docker-compose down

# Limpar dados e reiniciar
docker-compose down -v
docker-compose up -d
```

## Troubleshooting

### Backend não conecta no banco

1. Verifique se o Docker está rodando: `docker ps`
2. Verifique os logs: `docker-compose logs postgres`
3. Aguarde alguns segundos para o banco iniciar completamente

### Mobile não conecta no backend

1. Se estiver usando celular físico, altere o `API_URL` em `mobile/src/config/api.ts` para o IP da sua máquina (ex: `http://192.168.1.100:3000`)
2. Certifique-se de que o backend está rodando
3. Verifique o firewall

### Erro de permissão no PostgreSQL

Execute novamente:
```bash
docker-compose down -v
docker-compose up -d
```

## Próximos Passos

1. **WebSocket**: Implementar sincronização real-time
2. **Notificações**: Push notifications
3. **Pagamentos**: Integrar Stripe/PagSeguro
4. **Times**: Sistema de torcidas
5. **Relatórios**: Dashboard administrativo

## Suporte

Problemas? Abra uma issue no GitHub ou entre em contato.
