-- Migration: Add CPF and participant_name to quiz_participants table
-- This allows anonymous participation with CPF validation

-- Add new columns
ALTER TABLE quiz_participants
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14),
ADD COLUMN IF NOT EXISTS participant_name VARCHAR(255);

-- Make user_id nullable (since participants may not be registered users)
ALTER TABLE quiz_participants
ALTER COLUMN user_id DROP NOT NULL;

-- Drop old unique constraint
ALTER TABLE quiz_participants
DROP CONSTRAINT IF EXISTS quiz_participants_quiz_id_user_id_key;

-- Add new unique constraint for CPF per quiz (prevent same CPF joining twice)
ALTER TABLE quiz_participants
ADD CONSTRAINT quiz_participants_quiz_id_cpf_unique
UNIQUE (quiz_id, cpf);

-- Create index for CPF lookups
CREATE INDEX IF NOT EXISTS idx_participants_cpf ON quiz_participants(cpf);

-- Migration complete
