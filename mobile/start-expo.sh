#!/bin/bash

echo "🚀 Iniciando Expo para Torcida Quiz..."
echo ""
echo "📱 Backend rodando em: http://192.168.0.111:3000"
echo "📱 Metro Bundler em: http://192.168.0.111:8081"
echo ""

cd /Users/lucianosilva/work-torcedor/torcedor/mobile

# Limpa cache
rm -rf .expo

# Inicia o Expo
npx expo start --lan --clear

echo ""
echo "✅ Expo iniciado!"
echo "Use a URL que apareceu acima no Expo Go do iPhone"
