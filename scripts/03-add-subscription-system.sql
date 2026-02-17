-- Create subscriptions table (UUID SAFE)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  interviews_today INTEGER NOT NULL DEFAULT 0,
  interviews_limit INTEGER NOT NULL DEFAULT 1,
  start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Interview Sessions (UUID SAFE)
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interview_type VARCHAR(50) NOT NULL,
  difficulty VARCHAR(50) NOT NULL,
  job_role VARCHAR(255),
  experience_years INTEGER,
  tech_stack JSONB,
  resume_id UUID REFERENCES resumes(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Interview Results (UUID SAFE)
CREATE TABLE IF NOT EXISTS interview_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_score DECIMAL(5,2),
  emotion_score DECIMAL(5,2),
  speech_score DECIMAL(5,2),
  technical_score DECIMAL(5,2),
  confidence_score DECIMAL(5,2),
  communication_score DECIMAL(5,2),
  summary TEXT,
  feedback TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_interview_results_user_id ON interview_results(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_results_session_id ON interview_results(session_id);

-- Resume timestamp
ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Optional: link user to subscription
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id);
