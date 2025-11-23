export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  plan_type: 'free' | 'premium';
  max_participants: number;
  created_at: Date;
  updated_at: Date;
}

export interface Quiz {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  code: string;
  max_participants: number;
  status: 'draft' | 'active' | 'in_progress' | 'finished';
  scheduled_at?: Date;
  started_at?: Date;
  finished_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_order: number;
  time_limit: number;
  points: number;
  created_at: Date;
  updated_at: Date;
  options?: Option[];
}

export interface Option {
  id: string;
  question_id: string;
  option_text: string;
  option_order: number;
  is_correct: boolean;
  created_at: Date;
}

export interface QuizParticipant {
  id: string;
  quiz_id: string;
  user_id: string;
  joined_at: Date;
  total_score: number;
  total_time_ms: number;
  final_position?: number;
}

export interface ParticipantAnswer {
  id: string;
  participant_id: string;
  question_id: string;
  option_id?: string;
  answered_at: Date;
  time_taken_ms: number;
  is_correct: boolean;
  points_earned: number;
}

export interface SyncSession {
  id: string;
  quiz_id: string;
  current_question_id?: string;
  question_started_at?: Date;
  question_ends_at?: Date;
  status: 'waiting' | 'question_active' | 'question_ended' | 'quiz_finished';
  created_at: Date;
  updated_at: Date;
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

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}
