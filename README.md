# OneselfAI - AI Interview Preparation System

An AI-powered interview preparation platform with resume analysis, dynamic question generation, real-time speech recognition, emotion detection, and performance tracking.

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Recharts
- **Backend:** Next.js API Routes (no separate server needed)
- **Databases:** PostgreSQL (users, sessions, results) + MongoDB (logs, analytics)
- **AI:** OpenAI GPT for question generation and answer evaluation
- **Auth:** JWT with httpOnly cookies, bcrypt password hashing
- **File Uploads:** Local filesystem

---

## Prerequisites

Install these on your machine before starting:

1. **Node.js 18+** - [nodejs.org](https://nodejs.org/)
2. **PostgreSQL 14+** - [postgresql.org/download](https://www.postgresql.org/download/)
3. **MongoDB 6+** - [mongodb.com/docs/manual/installation](https://www.mongodb.com/docs/manual/installation/)

### Quick install (macOS with Homebrew):
```bash
brew install node postgresql@16 mongodb-community
brew services start postgresql@16
brew services start mongodb-community
```

### Quick install (Ubuntu/Debian):
```bash
sudo apt update && sudo apt install nodejs npm postgresql mongodb
sudo systemctl start postgresql
sudo systemctl start mongod
```

### Quick install (Windows):
- Download and install Node.js from [nodejs.org](https://nodejs.org/)
- Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
- Download and install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)

---

## Local Setup (Step-by-Step)

### 1. Clone the repository
```bash
git clone https://github.com/vallabhsangar12/oneselai-interview-prep-system.git
cd oneselai-interview-prep-system
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
The project includes a `.env.local` file with local defaults. If it's missing, copy from the example:
```bash
cp .env.example .env.local
```

**Your `.env.local` should contain:**
```env
MONGODB_URI=mongodb://127.0.0.1:27017/oneself-ai-interview
JWT_SECRET=a2eeeca2e128f793febbed61e2a57a60455be38c182af4fb795fdf8d743bb7bd
UPLOAD_DIR=OA-version-3/uploads/resumes/
NODE_ENV=development
POSTGRES_URL=postgresql://postgres:vallabh@localhost:5433/oneself-ai-interview
OPENAI_API_KEY=sk-your-openai-api-key-here
AUTH_SECRET=your-auth-secret
```

> **Important:** Update `POSTGRES_URL` if your local PostgreSQL uses a different password or port. The above assumes user `postgres`, password `vallabh`, port `5433`.

### 4. Create the PostgreSQL database
```bash
# If your PostgreSQL runs on port 5433:
psql -U postgres -p 5433 -c 'CREATE DATABASE "oneself-ai-interview";'

# Or if using default port 5432:
psql -U postgres -c 'CREATE DATABASE "oneself-ai-interview";'
```

> **Note:** The database name has hyphens, so it must be quoted in SQL.

### 5. Run the database schema migration
```bash
psql "postgresql://postgres:vallabh@localhost:5433/oneself-ai-interview" -f scripts/setup-local-db.sql
```

This creates all 7 tables (users, subscriptions, interview_sessions, interview_results, etc.), indexes, triggers, and auto-subscription on user signup.

### 6. Verify MongoDB is running
```bash
mongosh --eval "db.adminCommand('ping')"
```
MongoDB collections are created automatically when data is first inserted.

### 7. Create upload directories
```bash
mkdir -p uploads/resumes public/uploads/resumes
```

### 8. Start the development server
```bash
npm run dev
```

### 9. Open the app
Navigate to **http://localhost:3000** in your browser.

---

## How to Use

1. **Register** - Create an account at `/register`
2. **Login** - Sign in at `/login`
3. **Dashboard** - View your interview history, stats, and score charts at `/dashboard`
4. **Start Interview** - Go to `/interview` to configure and start a practice session
5. **Conduct Interview** - Answer AI-generated questions with speech recognition and webcam
6. **View Results** - Check scores, per-question feedback, strengths, and improvements
7. **Interview History** - Browse all past sessions at `/interview/history`
8. **Upload Resume** - Upload your PDF resume for AI-personalized questions
9. **Profile** - Manage your profile and change password at `/profile`

---

## Database Schema

### PostgreSQL Tables
| Table | Purpose |
|-------|---------|
| `users` | User accounts (email, name, password hash, profile) |
| `password_reset_tokens` | Password reset flow |
| `subscriptions` | Plan management (free/basic/pro), auto-created on signup |
| `resumes` | Resume file metadata |
| `interview_sessions` | Session tracking (type, difficulty, role, status) |
| `interview_results` | Scores, feedback, per-question data, transcript |
| `contact_submissions` | Contact form data |

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/register` | POST | User registration |
| `/api/login` | POST | User login (JWT cookie) |
| `/api/auth/me` | GET | Get current authenticated user |
| `/api/auth/logout` | POST | Logout (clear cookie) |
| `/api/auth/forgot-password` | POST | Request password reset email |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/profile` | GET/PUT | Get/update user profile |
| `/api/profile/change-password` | POST | Change password |
| `/api/dashboard-stats` | GET | Dashboard statistics + charts |
| `/api/interviews` | GET | Interview history list |
| `/api/interview-session` | POST | Create interview session |
| `/api/interview-session/[id]` | GET/PATCH | Get/update session |
| `/api/interview/generate-questions` | POST | AI-powered question generation |
| `/api/interview/evaluate-answer` | POST | AI-powered answer evaluation |
| `/api/interview-results` | GET/POST | Get/save interview results |
| `/api/interview-results/[id]` | GET | Get specific result detail |
| `/api/resume-upload` | POST/DELETE | Upload/delete resume |
| `/api/contact` | POST | Submit contact form |
| `/api/subscriptions/check` | GET | Check subscription status |
| `/api/subscriptions/select-plan` | POST | Select subscription plan |

---

## Available Scripts

```bash
npm run dev        # Start development server (http://localhost:3000)
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run setup      # Automated local setup (creates DB, runs migrations)
npm run db:setup   # Run PostgreSQL schema migration only
```

---

## Troubleshooting

### "Cannot connect to PostgreSQL"
- Ensure PostgreSQL is running: `pg_isready -p 5433`
- Check your port: your PostgreSQL may be on port `5433` instead of the default `5432`
- Check if the database exists: `psql -U postgres -p 5433 -l | grep oneself-ai-interview`
- Create it if missing: `psql -U postgres -p 5433 -c 'CREATE DATABASE "oneself-ai-interview";'`

### "MongoDB connection failed"
- Ensure MongoDB is running: `mongosh --eval "db.adminCommand('ping')"`
- Check the service: `brew services list` (macOS) or `systemctl status mongod` (Linux)

### "Module not found" errors
- Run `npm install` to ensure all dependencies are installed
- Delete `node_modules` and `.next`, then reinstall: `rm -rf node_modules .next && npm install`

### Resume upload fails
- Ensure the upload directories exist: `mkdir -p uploads/resumes public/uploads/resumes`

### AI questions not working
- Ensure `OPENAI_API_KEY` is set in `.env.local`
- The system falls back to built-in questions if OpenAI is unavailable

---

## Verification Checklist

After setup, verify these work:

- [ ] `http://localhost:3000` loads the landing page
- [ ] Register a new account at `/register`
- [ ] Login with the account at `/login`
- [ ] Dashboard loads at `/dashboard`
- [ ] Start an interview at `/interview`
- [ ] Interview conduct page records speech and shows webcam
- [ ] Results page shows scores and feedback
- [ ] Profile page loads at `/profile`
