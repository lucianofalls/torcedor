# ✅ Torcida Quiz - Sistema Completo Funcionando!

## 🎯 O que foi criado:

### ✅ Backend (Node.js + TypeScript + AWS Lambda Ready)
- API REST completa
- Autenticação JWT
- Sistema de quiz com perguntas e respostas
- Ranking em tempo real
- Preparado para WebSocket
- **STATUS: RODANDO** 🟢

### ✅ Banco de Dados (PostgreSQL)
- Schema completo com 11 tabelas
- Triggers e índices
- Dados de teste inseridos
- **STATUS: RODANDO** 🟢

### ✅ Mobile (React Native + Expo)
- 7 telas completas
- Navegação configurada
- Context API para autenticação
- **STATUS: PRONTO PARA TESTAR** 🟡

## 🚀 Como está rodando:

```
Docker Containers:
├── torcida-postgres  (porta 5433)
└── torcida-backend   (porta 3000)
```

### URLs:
- **Backend**: http://localhost:3000
- **PostgreSQL**: localhost:5433

### Credenciais de teste:
- **Email**: admin@torcida.com
- **Senha**: admin123

### Quiz de teste criado:
- **Código**: FSA6ZR
- **Pergunta**: "Qual a capital do Brasil?"
- 4 opções de resposta

## 🧪 Testes Executados:

✅ Registro de usuário
✅ Login
✅ Criar quiz
✅ Adicionar pergunta
✅ Listar quizzes
✅ Buscar detalhes do quiz

**Todos os testes passaram!**

## 📱 Próximo Passo: Testar o Mobile

### Opção 1: Celular Real com Expo Go (MAIS FÁCIL)

**Pré-requisitos:**
- Celular Android ou iPhone
- App "Expo Go" instalado
- Celular e PC na mesma rede WiFi

**Passos:**

1. **Descobrir seu IP** (execute na máquina):
   ```bash
   # No WSL2:
   cat /etc/resolv.conf | grep nameserver | awk '{print $2}'

   # Ou tente:
   ip route | grep default | awk '{print $3}'
   ```

2. **Configurar API no mobile**:

   Edite `mobile/src/config/api.ts`:
   ```typescript
   const API_URL = 'http://SEU_IP:3000'; // Ex: http://192.168.1.100:3000
   ```

3. **Iniciar o app**:
   ```bash
   cd mobile
   npm install    # Pode demorar 5-10min
   npx expo start
   ```

4. **Escanear QR Code**:
   - iOS: Abra a câmera e aponte para o QR
   - Android: Abra o Expo Go e escaneie

### Opção 2: Emulador Android

Se você tem Android Studio instalado:

```bash
# 1. Abrir Android Studio
# 2. Tools → AVD Manager → Criar/Iniciar dispositivo virtual
# 3. Depois:

cd mobile
npm install
npx expo start --android
```

### Opção 3: Web Browser (Limitado)

```bash
cd mobile
npm install
npx expo start --web
```

Nota: Algumas funcionalidades mobile não funcionam no browser.

## 🎮 Como Testar o Fluxo Completo:

### 1. No Primeiro Dispositivo (Criador):

```
1. Abrir app
2. Login: admin@torcida.com / admin123
3. Clicar "Criar Quiz"
4. Adicionar título e descrição
5. Adicionar perguntas (mínimo 1)
6. Quiz criado! Anote o CÓDIGO (ex: ABC123)
7. Ir em "Meus Quizzes" → Abrir o quiz
8. Clicar "Iniciar Quiz"
```

### 2. No Segundo Dispositivo (Participante):

```
1. Abrir app
2. Criar nova conta ou usar: user1@test.com / test123
3. Clicar "Entrar em Quiz"
4. Digitar o CÓDIGO do quiz
5. Aguardar o criador iniciar
6. Jogar! Responder antes do tempo acabar
7. Ver ranking ao final
```

## 🐛 Troubleshooting:

### Backend não responde:
```bash
docker compose ps              # Ver status
docker compose logs backend    # Ver logs
docker compose restart backend # Reiniciar
```

### Mobile não conecta:
```bash
# 1. Verificar se backend está UP:
curl http://localhost:3000/auth/login

# 2. Se estiver no WSL2, precisa usar o IP do Windows:
cat /etc/resolv.conf | grep nameserver

# 3. Testar conectividade:
ping SEU_IP

# 4. Verificar firewall do Windows
# Permitir conexão na porta 3000
```

### Expo não inicia:
```bash
cd mobile
rm -rf .expo node_modules
npm install --legacy-peer-deps
npx expo start --clear
```

## 📊 Comandos Úteis:

### Docker:
```bash
docker compose up -d          # Iniciar tudo
docker compose down           # Parar tudo
docker compose ps             # Ver status
docker compose logs -f backend # Ver logs em tempo real
docker compose restart backend # Reiniciar backend
```

### Backend:
```bash
# Testar API:
./test-api.sh

# Ver logs:
docker compose logs backend --tail 100

# Acessar shell do container:
docker exec -it torcida-backend sh
```

### Banco de Dados:
```bash
# Acessar PostgreSQL:
docker exec -it torcida-postgres psql -U torcida_user -d torcida_db

# Ver tabelas:
docker exec -it torcida-postgres psql -U torcida_user -d torcida_db -c "\dt"

# Ver usuários:
docker exec -it torcida-postgres psql -U torcida_user -d torcida_db -c "SELECT * FROM users;"
```

## 📂 Estrutura do Projeto:

```
torcida/
├── backend/              ✅ Node.js + TypeScript
│   ├── src/
│   │   ├── handlers/    # API endpoints
│   │   ├── config/      # Database
│   │   ├── utils/       # JWT, validação
│   │   └── types/       # TypeScript types
│   ├── package.json
│   └── serverless.yml   # AWS Lambda config
│
├── mobile/              🟡 React Native + Expo
│   ├── src/
│   │   ├── screens/     # 7 telas
│   │   ├── contexts/    # Auth
│   │   ├── navigation/  # Rotas
│   │   └── config/      # API config
│   └── package.json
│
├── database/            ✅ PostgreSQL
│   └── init/
│       ├── 01-schema.sql   # Tabelas
│       └── 02-seed.sql     # Dados teste
│
├── docker-compose.yml   ✅ Docker config
├── test-api.sh         ✅ Script de teste
├── MOBILE_SETUP.md     📖 Guia mobile
└── README.md           📖 Documentação
```

## 🎯 Funcionalidades Implementadas:

### Backend:
- [x] Autenticação JWT
- [x] Registro e Login
- [x] CRUD de Quiz
- [x] Sistema de perguntas
- [x] Código único por quiz
- [x] Limite de participantes
- [x] Sistema de pontuação (baseado em tempo)
- [x] Ranking
- [x] Validações
- [x] Error handling

### Mobile:
- [x] Telas de Login/Registro
- [x] Tela Home com lista de quizzes
- [x] Criar quiz com perguntas
- [x] Entrar no quiz por código
- [x] Jogar quiz com timer
- [x] Sistema de pontuação
- [x] Leaderboard
- [x] Navegação entre telas

### Banco de Dados:
- [x] 11 tabelas principais
- [x] Relacionamentos e constraints
- [x] Índices para performance
- [x] Triggers automáticos
- [x] Preparado para evolução (times, pagamentos, notificações)

## 🚢 Deploy (Futuro):

### Backend para AWS:
```bash
cd backend
npm run deploy:prod
```

### Mobile para Stores:
```bash
cd mobile
eas build --platform android
eas build --platform ios
eas submit
```

## 📈 Próximos Passos:

1. **Testar mobile** ← VOCÊ ESTÁ AQUI
2. Implementar WebSocket real-time
3. Push notifications
4. Sistema de times/torcidas
5. Pagamentos (Stripe/PagSeguro)
6. Dashboard administrativo
7. Analytics

## 💡 Dicas:

- Use `FSA6ZR` para testar com um quiz já pronto
- Execute `./test-api.sh` sempre que precisar testar a API
- Logs do backend: `docker compose logs -f backend`
- Para parar tudo: `docker compose down`

## ✅ Checklist de Testes:

- [ ] Backend respondendo (`curl http://localhost:3000/auth/login`)
- [ ] Mobile configurado com IP correto
- [ ] Expo Go instalado no celular
- [ ] Mobile iniciado (`npx expo start`)
- [ ] QR Code escaneado
- [ ] App aberto no celular
- [ ] Login funcionando
- [ ] Quiz criado
- [ ] Segundo dispositivo entrou no quiz
- [ ] Quiz jogado
- [ ] Ranking visualizado

---

**🎉 Tudo pronto para testar!** Comece pelo mobile seguindo as instruções acima.
