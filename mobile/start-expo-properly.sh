#!/bin/bash

echo "🔧 Limpando processos antigos..."
lsof -ti:8081,19000,19001,19002 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 2

echo "📱 Iniciando Expo..."
echo ""
echo "⚠️  IMPORTANTE: Certifique-se que:"
echo "   1. iPhone e Mac estão na MESMA rede Wi-Fi"
echo "   2. Abra o app Expo Go no iPhone"
echo "   3. Escaneie o QR code que vai aparecer"
echo ""
echo "Iniciando em 3 segundos..."
sleep 3

# Iniciar Expo com hostname correto
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.111 npx expo start --lan --clear
