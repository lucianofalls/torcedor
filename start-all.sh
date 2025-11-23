#!/bin/bash

echo "🚀 Iniciando Torcida Quiz (Docker)..."
echo ""

# Parar containers antigos
echo "🛑 Parando containers antigos..."
docker compose down 2>/dev/null

# Limpar porta 5432 se necessário
if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  PostgreSQL já está rodando na porta 5432"
    echo "   Você pode:"
    echo "   1. Parar o PostgreSQL local: sudo systemctl stop postgresql"
    echo "   2. Ou mudar a porta no docker-compose.yml"
    read -p "   Parar PostgreSQL local? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        sudo systemctl stop postgresql
    else
        echo "   Editando docker-compose.yml para usar porta 5433..."
        sed -i 's/"5432:5432"/"5433:5432"/' docker-compose.yml
        sed -i 's/DB_PORT: 5432/DB_PORT: 5433/' docker-compose.yml
    fi
fi

# Iniciar containers
echo "🐳 Iniciando containers..."
docker compose up -d

echo ""
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Verificar status
echo ""
echo "📊 Status dos serviços:"
docker compose ps

echo ""
echo "✅ Torcida Quiz está rodando!"
echo ""
echo "🔗 URLs:"
echo "   Backend: http://localhost:3000"
echo "   PostgreSQL: localhost:5432"
echo ""
echo "📱 Para testar a API:"
echo "   ./test-api.sh"
echo ""
echo "📱 Para ver os logs:"
echo "   docker compose logs -f backend"
echo ""
echo "🛑 Para parar tudo:"
echo "   docker compose down"
