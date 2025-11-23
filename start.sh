#!/bin/bash

echo "🚀 Iniciando Torcida Quiz App..."

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
  exit 1
fi

# Subir o PostgreSQL
echo "📦 Iniciando PostgreSQL..."
docker-compose up -d

# Aguardar o PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL estar pronto..."
sleep 5

# Verificar se o backend está configurado
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Instalando dependências do backend..."
  cd backend
  npm install
  cd ..
fi

# Verificar se o mobile está configurado
if [ ! -d "mobile/node_modules" ]; then
  echo "📦 Instalando dependências do mobile..."
  cd mobile
  npm install
  cd ..
fi

echo "✅ Setup completo!"
echo ""
echo "Para iniciar os serviços:"
echo "  Backend:  cd backend && npm run dev"
echo "  Mobile:   cd mobile && npx expo start"
echo ""
echo "Credenciais de teste:"
echo "  Email: admin@torcida.com"
echo "  Senha: admin123"
