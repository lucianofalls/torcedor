export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  plan_type: 'free' | 'premium';
  max_participants: number;
}

export interface Quiz {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  code: string;
  max_participants: number;
  status: 'draft' | 'active' | 'in_progress' | 'finished';
  participant_count?: number;
  created_at: string;
  questions?: Question[];
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_order: number;
  time_limit: number;
  points: number;
  options: Option[];
}

export interface Option {
  id: string;
  question_id: string;
  option_text: string;
  option_order: number;
}

export interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  total_score: number;
  total_time_ms: number;
  position: number;
  correct_answers: number;
  total_questions: number;
}

export interface AnswerResult {
  is_correct: boolean;
  points_earned: number;
  time_taken_ms: number;
}
