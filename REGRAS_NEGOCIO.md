# Regras de Negócio - Sistema de Quiz Torcida

## Status do Quiz

### Estados Possíveis
- **inactive**: Quiz foi criado mas ainda não está disponível para participantes
- **active**: Quiz está disponível para participantes entrarem (mas não iniciado)
- **in_progress**: Quiz foi iniciado e está em andamento
- **finished**: Quiz foi finalizado

### Fluxo de Estados
1. Quiz é **criado** → status = `inactive`
2. Criador **ativa** o quiz → status = `active`
3. Criador **inicia** o quiz → status = `in_progress`
4. Criador **finaliza** o quiz → status = `finished`

## Participação em Quizzes

### Regra de Entrada
- Usuários (autenticados ou anônimos) **SÓ PODEM ENTRAR** em quizzes com status:
  - `active` (ativado mas não iniciado)
  - `in_progress` (já em andamento)

- **NÃO PODEM ENTRAR** em quizzes:
  - `inactive` (ainda não ativado pelo criador)
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
- Todo quiz **NASCE COMO `inactive`**
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

## Constraint do Banco de Dados

### Tabela: quizzes
```sql
CHECK (status IN ('inactive', 'active', 'in_progress', 'finished'))
```

## Botões e Ações da Interface

### Quiz com status `inactive`
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

## Importante
- **NUNCA** permitir entrada em quiz `inactive`
- **SEMPRE** criar quiz como `inactive`
- O criador deve **explicitamente ativar** antes dos participantes poderem entrar
- Perguntas podem ser adicionadas quando o quiz está `inactive` ou `active`
- Não é possível adicionar/editar perguntas após iniciar o quiz (`in_progress` ou `finished`)
