#!/bin/bash

echo "Aguardando o download do simulador iOS terminar..."
echo "Este script irá rodar automaticamente 'npx expo run:ios' quando o download terminar."

# Aguarda o processo xcodebuild terminar
while pgrep -f "xcodebuild -downloadAllPlatforms" > /dev/null; do
    echo "Download ainda em progresso... aguardando..."
    sleep 30
done

echo ""
echo "Download concluído! Verificando simuladores disponíveis..."
xcrun simctl list devices available

echo ""
echo "Iniciando o app no simulador iOS..."
cd /Users/lucianosilva/work-torcedor/torcedor/mobile
npx expo run:ios
