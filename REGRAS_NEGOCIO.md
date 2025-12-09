# Regras de Negócio - Sistema de Quiz Torcida

## Status do Quiz

### Estados Possíveis
- **draft**: Quiz foi criado mas ainda não está disponível para participantes (rascunho)
- **active**: Quiz está disponível para participantes entrarem (mas não iniciado)
- **in_progress**: Quiz foi iniciado e está em andamento
- **finished**: Quiz foi finalizado

### Fluxo de Estados
```
draft → active → in_progress → finished
```

1. Quiz é **criado** → status = `draft`
2. Criador **ativa** o quiz → status = `active`
3. Criador **inicia** o quiz → status = `in_progress`
4. Criador **finaliza** o quiz → status = `finished`

### Significado de Cada Status
| Status | Descrição | Participantes podem entrar? | Pode editar/excluir? |
|--------|-----------|---------------------------|---------------------|
| `draft` | Rascunho - quiz em preparação | NÃO | SIM |
| `active` | Ativado - aguardando início | SIM | SIM |
| `in_progress` | Em andamento | SIM | NÃO |
| `finished` | Finalizado | NÃO | NÃO |

## Participação em Quizzes

### Regra de Entrada
- Usuários (autenticados ou anônimos) **SÓ PODEM ENTRAR** em quizzes com status:
  - `active` (ativado mas não iniciado)
  - `in_progress` (já em andamento)

- **NÃO PODEM ENTRAR** em quizzes:
  - `draft` (ainda não ativado pelo criador - em rascunho)
  - `finished` (já finalizado)

### Participantes Anônimos
- Devem fornecer:
  - CPF válido (com validação de dígitos verificadores)
  - Nome (mínimo 3 caracteres)
- Não possuem token JWT
- São identificados pelo CPF no banco de dados
- Podem ver o ranking sem autenticação

### Participantes Autenticados
- Devem fornecer token JWT válido
- São identificados pelo user_id no banco de dados
- Têm acesso completo ao sistema

## Ranking/Leaderboard

### Acesso
- **Público**: Não requer autenticação
- Qualquer pessoa pode ver o ranking de um quiz (autenticada ou não)

### Dados Exibidos
- Posição
- Nome do participante (de users.name ou quiz_participants.participant_name)
- Pontuação total
- Tempo total
- Respostas corretas
- Total de perguntas respondidas

### Ordenação
1. Maior pontuação (DESC)
2. Menor tempo (ASC) - desempate

## Criação de Quiz

### Status Inicial
- Todo quiz **NASCE COMO `draft`**
- Só fica disponível para entrada após o criador **ativar**

### Campos Obrigatórios
- title (título)
- creator_id (ID do usuário criador)

### Campos Opcionais
- description (descrição)
- max_participants (padrão: 50)

### Código do Quiz
- Gerado automaticamente
- Único
- Usado pelos participantes para entrar

## Edição e Exclusão de Quiz

### Quizzes que podem ser editados/excluídos
- Status `draft` - SIM
- Status `active` - SIM
- Status `in_progress` - NÃO
- Status `finished` - NÃO

### Regra
Apenas quizzes em `draft` ou `active` podem ser editados ou excluídos.
Após iniciar (`in_progress`) ou finalizar (`finished`), não é mais possível editar ou excluir.

## Constraint do Banco de Dados

### Tabela: quizzes
```sql
CHECK (status IN ('draft', 'active', 'in_progress', 'finished'))
```

## Botões e Ações da Interface

### Quiz com status `draft`
- Botão **"Ativar Quiz"** - Muda o status para `active`
- Botão **"Adicionar Pergunta"** - Permite adicionar perguntas
- Botão **"Editar Quiz"** - Permite editar título e descrição
- Botão **"Excluir Quiz"** - Permite excluir o quiz

### Quiz com status `active`
- Botão **"Iniciar Quiz"** - Muda o status para `in_progress` (só se tiver perguntas)
- Botão **"Adicionar Pergunta"** - Permite adicionar perguntas
- Botão **"Editar Quiz"** - Permite editar título e descrição
- Botão **"Excluir Quiz"** - Permite excluir o quiz

### Quiz com status `in_progress`
- Botão **"Finalizar Quiz"** - Muda o status para `finished`
- Botão **"Ver Ranking"** - Mostra o leaderboard

### Quiz com status `finished`
- Botão **"Ver Ranking"** - Mostra o leaderboard

## Resumo das Regras Importantes

1. **NUNCA** permitir entrada em quiz `draft`
2. **SEMPRE** criar quiz como `draft`
3. O criador deve **explicitamente ativar** antes dos participantes poderem entrar
4. Perguntas podem ser adicionadas quando o quiz está `draft` ou `active`
5. Não é possível adicionar/editar perguntas após iniciar o quiz (`in_progress` ou `finished`)
6. Edição e exclusão só são permitidas em `draft` ou `active`

## Retomada de Quiz (Resume)

### Funcionalidade
Permite que participantes anônimos retomem um quiz do ponto onde pararam, caso:
1. O quiz ainda esteja em andamento (`in_progress`)
2. O tempo total do quiz ainda não tenha expirado
3. O participante ainda não tenha completado todas as perguntas

### Cálculo de Expiração de Tempo
O tempo total do quiz é calculado como:
```
tempo_total = SUM(time_limit de todas as perguntas) + 30 segundos (margem)
```

A expiração é verificada como:
```
tempo_expirado = (agora - started_at) > tempo_total
```

### Fluxo de Retomada
1. Participante entra no quiz (via código)
2. Sistema verifica se já participou antes (pelo CPF)
3. Se já respondeu algumas perguntas:
   - Backend verifica se tempo expirou via `/quizzes/:id/progress`
   - Se expirou: retorna HTTP 410 com `{ timeExpired: true }`
   - Se completou: retorna HTTP 400 com `{ isCompleted: true }`
   - Se pode continuar: retorna `nextQuestionIndex` e `remainingSeconds`
4. Frontend posiciona o quiz na próxima pergunta não respondida

### Dados Rastreados por Participante
- `participant_answers`: Respostas já enviadas
- `total_score`: Pontuação acumulada
- `completed_at`: Data de conclusão (NULL se não completou)

### Endpoints Relacionados
- `GET /quizzes/:id/progress?cpf=XXX` - Retorna progresso do participante
- `GET /participants/:cpf/quizzes` - Lista quizzes do participante

### Respostas do Endpoint `/progress`
| Cenário | HTTP Status | Dados |
|---------|-------------|-------|
| Sucesso | 200 | `{ nextQuestionIndex, currentScore, remainingSeconds }` |
| Tempo expirado | 410 | `{ timeExpired: true }` |
| Já completou | 400 | `{ isCompleted: true }` |
| Quiz não iniciado | 400 | `{ status: "active" }` |
| Participante não encontrado | 404 | - |

## Arquivos Relacionados

### Backend
- `backend/src/handlers/quiz.ts` - Handlers de CRUD do quiz
  - `create`: Cria quiz com status `draft`
  - `update`: Aceita `draft` ou `active`
  - `remove`: Aceita `draft` ou `active`
  - `activate`: Aceita apenas `draft`
  - `join`: Aceita `active` ou `in_progress`
  - `start`: Muda de `active` para `in_progress`
  - `finish`: Muda para `finished`
  - `getProgress`: Retorna progresso do participante (valida tempo expirado)
  - `getParticipantQuizzes`: Lista quizzes de um participante (valida tempo expirado)

### Frontend
- `mobile/src/screens/QuizDetailsScreen.tsx` - Tela de detalhes do quiz
  - Exibe botões condicionalmente baseado no status
  - `draft`: Editar, Excluir, Ativar, Adicionar Pergunta
  - `active`: Editar, Excluir, Iniciar, Adicionar Pergunta
  - `in_progress`: Finalizar, Ver Ranking
  - `finished`: Ver Ranking
