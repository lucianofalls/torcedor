-- Fix database schema for anonymous participation
-- This script updates the database to match the current application code

-- 1. Rename 'answers' table to 'participant_answers'
ALTER TABLE IF EXISTS answers RENAME TO participant_answers;

-- 2. Add CPF and participant_name columns to quiz_participants
ALTER TABLE quiz_participants
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14),
ADD COLUMN IF NOT EXISTS participant_name VARCHAR(255);

-- 3. Add total_score and total_time_ms columns
ALTER TABLE quiz_participants
ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_time_ms INTEGER DEFAULT 0;

-- 4. Make user_id nullable (since participants may be anonymous)
ALTER TABLE quiz_participants
ALTER COLUMN user_id DROP NOT NULL;

-- 5. Drop old unique constraint if it exists
ALTER TABLE quiz_participants
DROP CONSTRAINT IF EXISTS quiz_participants_quiz_id_user_id_key;

-- 6. Add new unique constraint for CPF per quiz (prevent same CPF joining twice)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'quiz_participants_quiz_id_cpf_unique'
    ) THEN
        ALTER TABLE quiz_participants
        ADD CONSTRAINT quiz_participants_quiz_id_cpf_unique
        UNIQUE (quiz_id, cpf);
    END IF;
END $$;

-- 7. Create index for CPF lookups
CREATE INDEX IF NOT EXISTS idx_participants_cpf ON quiz_participants(cpf);

-- 8. Rename columns in participant_answers to match code
ALTER TABLE participant_answers
RENAME COLUMN IF EXISTS time_taken TO time_taken_ms;

-- 9. Add is_correct column if it doesn't exist
ALTER TABLE participant_answers
ADD COLUMN IF NOT EXISTS is_correct BOOLEAN DEFAULT FALSE;

-- Schema update complete
