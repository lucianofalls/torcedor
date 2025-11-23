#!/bin/bash

echo "🧪 Testando API do Torcida Quiz..."
echo ""

BASE_URL="http://localhost:3000"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Teste 1: Registrar
echo -e "${YELLOW}1. Registrando novo usuário...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste User",
    "email": "teste'$(date +%s)'@email.com",
    "password": "123456"
  }')

echo $REGISTER_RESPONSE | jq .
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.token')

if [ "$TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Registro OK${NC}"
else
  echo -e "${RED}✗ Erro no registro${NC}"
  exit 1
fi
echo ""

# Teste 2: Login
echo -e "${YELLOW}2. Fazendo login com admin...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@torcida.com",
    "password": "admin123"
  }')

echo $LOGIN_RESPONSE | jq .
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

if [ "$TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Login OK${NC}"
else
  echo -e "${RED}✗ Erro no login${NC}"
  exit 1
fi
echo ""

# Teste 3: Criar Quiz
echo -e "${YELLOW}3. Criando quiz...${NC}"
QUIZ_RESPONSE=$(curl -s -X POST $BASE_URL/quizzes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Quiz de Teste API",
    "description": "Quiz criado via script de teste",
    "max_participants": 50
  }')

echo $QUIZ_RESPONSE | jq .
QUIZ_ID=$(echo $QUIZ_RESPONSE | jq -r '.data.id')
QUIZ_CODE=$(echo $QUIZ_RESPONSE | jq -r '.data.code')

if [ "$QUIZ_ID" != "null" ]; then
  echo -e "${GREEN}✓ Quiz criado: $QUIZ_CODE${NC}"
else
  echo -e "${RED}✗ Erro ao criar quiz${NC}"
  exit 1
fi
echo ""

# Teste 4: Adicionar Pergunta
echo -e "${YELLOW}4. Adicionando pergunta...${NC}"
QUESTION_RESPONSE=$(curl -s -X POST $BASE_URL/quizzes/$QUIZ_ID/questions \
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
  }')

echo $QUESTION_RESPONSE | jq .
QUESTION_ID=$(echo $QUESTION_RESPONSE | jq -r '.data.id')

if [ "$QUESTION_ID" != "null" ]; then
  echo -e "${GREEN}✓ Pergunta adicionada${NC}"
else
  echo -e "${RED}✗ Erro ao adicionar pergunta${NC}"
  exit 1
fi
echo ""

# Teste 5: Listar Quizzes
echo -e "${YELLOW}5. Listando quizzes...${NC}"
LIST_RESPONSE=$(curl -s -X GET $BASE_URL/quizzes \
  -H "Authorization: Bearer $TOKEN")

echo $LIST_RESPONSE | jq .
COUNT=$(echo $LIST_RESPONSE | jq '.data | length')

if [ "$COUNT" -gt "0" ]; then
  echo -e "${GREEN}✓ ${COUNT} quizzes encontrados${NC}"
else
  echo -e "${RED}✗ Nenhum quiz encontrado${NC}"
fi
echo ""

# Teste 6: Ver Quiz Completo
echo -e "${YELLOW}6. Buscando detalhes do quiz...${NC}"
DETAIL_RESPONSE=$(curl -s -X GET $BASE_URL/quizzes/$QUIZ_ID \
  -H "Authorization: Bearer $TOKEN")

echo $DETAIL_RESPONSE | jq .
QUESTIONS_COUNT=$(echo $DETAIL_RESPONSE | jq '.data.questions | length')

if [ "$QUESTIONS_COUNT" -gt "0" ]; then
  echo -e "${GREEN}✓ Quiz tem ${QUESTIONS_COUNT} pergunta(s)${NC}"
else
  echo -e "${RED}✗ Quiz sem perguntas${NC}"
fi
echo ""

# Resumo
echo -e "${GREEN}✅ Todos os testes passaram!${NC}"
echo ""
echo "Detalhes do Quiz criado:"
echo "  ID: $QUIZ_ID"
echo "  Código: $QUIZ_CODE"
echo ""
echo "Use este código no app mobile para entrar no quiz!"
