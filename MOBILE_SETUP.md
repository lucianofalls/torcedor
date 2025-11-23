# Como Testar o App Mobile

## ✅ Backend já está rodando!
- Backend: http://localhost:3000
- Código de quiz de teste: **FSA6ZR**
- Login: admin@torcida.com / admin123

## Opção 1: Celular Real (RECOMENDADO)

### 1. Instalar Expo Go
- **iOS**: https://apps.apple.com/app/expo-go/id982107779
- **Android**: https://play.google.com/store/apps/details?id=host.exp.exponent

### 2. Descobrir seu IP local
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1
```

### 3. Configurar a API
Edite: `mobile/src/config/api.ts`

Substitua:
```typescript
const API_URL = 'http://localhost:3000';
```

Por (usando seu IP):
```typescript
const API_URL = 'http://SEU_IP_AQUI:3000'; // Ex: http://192.168.1.100:3000
```

### 4. Iniciar o app
```bash
cd mobile
npm install
npx expo start
```

### 5. Escanear QR Code
- **iOS**: Câmera do iPhone → escanear QR code
- **Android**: Abrir Expo Go → escanear QR code

## Opção 2: Emulador Android (se tiver Android Studio)

```bash
# 1. Abrir Android Studio e iniciar AVD (emulador)

# 2. Não precisa mudar o IP (localhost funciona)

# 3. Iniciar
cd mobile
npm install
npx expo start --android
```

## Opção 3: Simulador iOS (Mac apenas)

```bash
cd mobile
npm install
npx expo start --ios
```

## Testando no App

1. **Login**
   - Email: admin@torcida.com
   - Senha: admin123

2. **Criar Quiz**
   - Título: "Meu Quiz"
   - Adicione perguntas
   - Anote o código

3. **Entrar no Quiz** (outro celular/conta)
   - Use o código: FSA6ZR (ou seu novo código)
   - Aguarde o criador iniciar

4. **Jogar**
   - Responda as perguntas
   - Veja o ranking

## Troubleshooting

### App não conecta no backend:
```bash
# 1. Verificar se backend está rodando
docker compose ps

# Deve mostrar torcida-backend UP

# 2. Ver logs do backend
docker compose logs backend -f

# 3. Testar conexão
curl http://localhost:3000/auth/login
```

### Celular não encontra backend:
- Celular e PC devem estar na mesma rede WiFi
- Verifique firewall
- Teste o IP: `ping SEU_IP`

### Expo não inicia:
```bash
cd mobile
rm -rf .expo node_modules
npm install
npx expo start --clear
```

## Comandos Úteis

```bash
# Ver logs do Docker
docker compose logs -f backend

# Parar tudo
docker compose down

# Reiniciar
docker compose restart backend

# Ver status
docker compose ps
```
