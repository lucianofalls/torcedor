#!/bin/bash

echo "📱 Iniciando Torcida Quiz Mobile..."
echo ""

# Verificar se backend está rodando
if ! curl -s http://localhost:3000/auth/login > /dev/null 2>&1; then
    echo "⚠️  Backend não está respondendo!"
    echo "   Execute primeiro: docker compose up -d"
    exit 1
fi

echo "✅ Backend está rodando!"
echo ""

# Descobrir IP
echo "🔍 Detectando IP da máquina..."
IP=$(cat /etc/resolv.conf 2>/dev/null | grep nameserver | awk '{print $2}' || hostname -I | awk '{print $1}')
echo "   IP detectado: $IP"
echo ""

# Verificar se já está configurado
if grep -q "localhost:3000" mobile/src/config/api.ts 2>/dev/null; then
    echo "⚠️  API ainda está configurada para localhost!"
    echo ""
    echo "   Para testar no celular, edite:"
    echo "   mobile/src/config/api.ts"
    echo ""
    echo "   Substitua:"
    echo "   const API_URL = 'http://localhost:3000';"
    echo ""
    echo "   Por:"
    echo "   const API_URL = 'http://$IP:3000';"
    echo ""
    read -p "   Quer que eu faça isso automaticamente? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        sed -i "s|http://localhost:3000|http://$IP:3000|g" mobile/src/config/api.ts
        echo "   ✅ API configurada para $IP:3000"
    fi
    echo ""
fi

# Ir para pasta mobile
cd mobile

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências (pode demorar 5-10 min)..."
    npm install
    echo ""
fi

echo "🚀 Iniciando Expo..."
echo ""
echo "   Depois de iniciar:"
echo "   1. No celular, abra o app 'Expo Go'"
echo "   2. Escaneie o QR code que vai aparecer"
echo "   3. Aguarde o app carregar"
echo ""
echo "   Login de teste:"
echo "   Email: admin@torcida.com"
echo "   Senha: admin123"
echo ""
echo "   Código de quiz pronto: FSA6ZR"
echo ""

npx expo start
