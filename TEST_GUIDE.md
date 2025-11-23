# Guia de Teste - Torcida Quiz

## Passo 1: Configurar o Banco de Dados

Execute:
```bash
./setup-db.sh
```

Ou manualmente:
```bash
sudo -u postgres psql -c "CREATE DATABASE torcida_db;"
sudo -u postgres psql -c "CREATE USER torcida_user WITH PASSWORD 'torcida_pass_2024';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE torcida_db TO torcida_user;"
sudo -u postgres psql -d torcida_db < database/init/01-schema.sql
sudo -u postgres psql -d torcida_db < database/init/02-seed.sql
```

## Passo 2: Testar o Backend

### Opção A: Servidor Express (Desenvolvimento Local)

```bash
cd backend
npm run dev
```

Isso inicia um servidor Express em `http://localhost:3000`

### Opção B: Serverless Offline (Simula Lambda)

```bash
cd backend
npx serverless offline
```

Isso simula AWS Lambda localmente em `http://localhost:3000`

### Testar a API

**1. Registrar usuário:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste User",
    "email": "teste@email.com",
    "password": "123456"
  }'
```

**2. Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@torcida.com",
    "password": "admin123"
  }'
```

Copie o `token` da resposta para usar nos próximos comandos.

**3. Criar Quiz:**
```bash
TOKEN="seu_token_aqui"

curl -X POST http://localhost:3000/quizzes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Quiz de Teste",
    "description": "Meu primeiro quiz",
    "max_participants": 50
  }'
```

Salve o `id` e `code` do quiz.

**4. Adicionar Pergunta:**
```bash
QUIZ_ID="id_do_quiz_aqui"

curl -X POST http://localhost:3000/quizzes/$QUIZ_ID/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "question_text": "Qual a capital do Brasil?",
    "time_limit": 30,
    "points": 100,
    "options": [
      {"text": "São Paulo", "is_correct": false},
      {"text": "Rio de Janeiro", "is_correct": false},
      {"text": "Brasília", "is_correct": true},
      {"text": "Salvador", "is_correct": false}
    ]
  }'
```

**5. Iniciar Quiz:**
```bash
curl -X POST http://localhost:3000/quizzes/$QUIZ_ID/start \
  -H "Authorization: Bearer $TOKEN"
```

**6. Entrar no Quiz (outro usuário):**
```bash
QUIZ_CODE="ABC123"  # Código do quiz

curl -X POST http://localhost:3000/quizzes/$QUIZ_CODE/join \
  -H "Authorization: Bearer $TOKEN"
```

**7. Ver Ranking:**
```bash
curl http://localhost:3000/quizzes/$QUIZ_ID/leaderboard \
  -H "Authorization: Bearer $TOKEN"
```

## Passo 3: Testar o Mobile

### Opção A: Expo Go no Celular (Mais Fácil)

1. **Instale o Expo Go:**
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Configure o IP do Backend:**

   Edite `mobile/src/config/api.ts`:
   ```typescript
   const API_URL = 'http://SEU_IP_LOCAL:3000'; // Ex: http://192.168.1.100:3000
   ```

   Descubra seu IP:
   ```bash
   ip addr show | grep "inet " | grep -v 127.0.0.1
   ```

3. **Inicie o Expo:**
   ```bash
   cd mobile
   npm install
   npx expo start
   ```

4. **Escaneie o QR Code:**
   - iOS: Use a câmera do iPhone
   - Android: Use o app Expo Go

### Opção B: Emulador Android

1. **Instale o Android Studio:**
   - Download: https://developer.android.com/studio

2. **Configure um emulador:**
   ```bash
   # Abra o AVD Manager no Android Studio
   # Crie um dispositivo virtual (ex: Pixel 5)
   ```

3. **Inicie o emulador e o app:**
   ```bash
   cd mobile
   npm install
   npx expo start --android
   ```

### Opção C: Simulador iOS (Mac apenas)

```bash
cd mobile
npm install
npx expo start --ios
```

## Passo 4: Testar Fluxo Completo

### No App Mobile:

1. **Login:**
   - Email: admin@torcida.com
   - Senha: admin123

2. **Criar Quiz:**
   - Clique em "Criar Quiz"
   - Preencha título e descrição
   - Adicione pelo menos 1 pergunta com 4 opções
   - Marque a resposta correta
   - Anote o código gerado

3. **Outro Dispositivo/Usuário:**
   - Crie nova conta ou use outro celular
   - Clique em "Entrar em Quiz"
   - Digite o código
   - Aguarde o criador iniciar

4. **Iniciar Quiz:**
   - No dispositivo do criador, abra o quiz
   - Clique em "Iniciar Quiz"

5. **Jogar:**
   - Responda as perguntas antes do tempo acabar
   - Veja sua pontuação

6. **Ver Ranking:**
   - Clique em "Ver Ranking"
   - Veja sua posição

## Passo 5: Testar Lambda Localmente (Opcional)

O `serverless-offline` simula o AWS Lambda:

```bash
cd backend
npx serverless offline
```

Isso:
- Simula API Gateway
- Simula Lambda functions
- Simula WebSocket (para real-time)

Endpoints disponíveis:
- http://localhost:3000/auth/login
- http://localhost:3000/quizzes
- etc.

## Logs e Debug

### Backend:
```bash
# Ver logs
cd backend
npm run dev

# Logs aparecerão no terminal
```

### Mobile:
```bash
# Ver logs do Expo
npx expo start

# Abra o menu (shake no celular ou Cmd+D no iOS / Cmd+M no Android)
# Vá em "Debug Remote JS"
# Abra Chrome DevTools
```

## Problemas Comuns

### Backend não conecta no banco:
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar conexão
psql -U torcida_user -d torcida_db -h localhost
```

### Mobile não conecta no backend:
- Verifique se backend está rodando
- Verifique o IP em `mobile/src/config/api.ts`
- Celular e PC devem estar na mesma rede WiFi
- Desabilite firewall temporariamente

### Expo não abre:
```bash
# Limpar cache
cd mobile
rm -rf .expo
npx expo start --clear
```

## Métricas de Performance

- **Backend latency**: < 100ms (local)
- **Quiz load time**: < 1s
- **Answer submission**: < 500ms
- **Leaderboard update**: Real-time (WebSocket)

## Next Steps

Depois de testar:
1. Deploy backend para AWS Lambda
2. Configurar RDS
3. Build mobile para Android/iOS
4. Publicar nas stores
