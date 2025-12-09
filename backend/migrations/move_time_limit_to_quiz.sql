-- Migration: Mover time_limit de pergunta para quiz
-- Data: 2024-12-09
-- Descrição: Adiciona coluna time_limit na tabela quizzes (tempo único para todas as perguntas)

-- 1. Adicionar coluna time_limit na tabela quizzes (padrão 30 segundos)
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS time_limit INTEGER DEFAULT 30;

-- 2. Para quizzes existentes, usar o time_limit da primeira pergunta (se houver)
UPDATE quizzes q
SET time_limit = COALESCE(
    (SELECT time_limit FROM questions WHERE quiz_id = q.id ORDER BY question_order LIMIT 1),
    30
)
WHERE q.time_limit IS NULL OR q.time_limit = 30;

-- Nota: A coluna time_limit em questions será mantida por compatibilidade,
-- mas o frontend e backend usarão quiz.time_limit
