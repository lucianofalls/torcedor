#!/bin/bash

echo "🗄️  Configurando banco de dados..."

# Criar banco e usuário
sudo -u postgres psql << 'EOF'
-- Criar banco de dados
DROP DATABASE IF EXISTS torcida_db;
CREATE DATABASE torcida_db;

-- Criar usuário
DROP USER IF EXISTS torcida_user;
CREATE USER torcida_user WITH ENCRYPTED PASSWORD 'torcida_pass_2024';

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE torcida_db TO torcida_user;

-- Conectar ao banco e dar permissões no schema
\c torcida_db
GRANT ALL ON SCHEMA public TO torcida_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO torcida_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO torcida_user;
EOF

echo "✅ Banco e usuário criados"

# Executar schema
echo "📋 Criando tabelas..."
sudo -u postgres psql -d torcida_db < database/init/01-schema.sql

echo "📊 Inserindo dados de teste..."
sudo -u postgres psql -d torcida_db < database/init/02-seed.sql

echo "✅ Banco de dados configurado!"
echo ""
echo "Credenciais:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: torcida_db"
echo "  User: torcida_user"
echo "  Password: torcida_pass_2024"
echo ""
echo "Login de teste:"
echo "  Email: admin@torcida.com"
echo "  Senha: admin123"
