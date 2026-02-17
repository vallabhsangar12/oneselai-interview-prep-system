# OneselfAI - AI Interview Preparation System

An AI-powered interview preparation platform with resume analysis, dynamic question generation, emotion/voice analysis, and performance tracking.

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui
- **Backend:** Next.js API Routes (no separate server needed)
- **Databases:** PostgreSQL (users, sessions, results) + MongoDB (logs, emotion data, voice data)
- **Auth:** JWT with httpOnly cookies, bcrypt password hashing
- **File Uploads:** Local filesystem (`./uploads/` and `./public/uploads/`)

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
sudo apt update
sudo apt install nodejs npm postgresql mongodb
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

**Default `.env.local` contents:**
```env
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/oneselai
MONGODB_URI=mongodb://localhost:27017/oneselai
JWT_SECRET=local_dev_jwt_secret_key_change_in_production
NODE_ENV=development
UPLOAD_DIR=./uploads
```

> **Note:** If your local PostgreSQL uses a different username/password, update `POSTGRES_URL` accordingly.

### 4. Create the PostgreSQL database
```bash
# Create the database
createdb oneselai

# Or via psql:
psql -U postgres -c "CREATE DATABASE oneselai;"
```

### 5. Run the database schema migration
```bash
psql -U postgres -d oneselai -f scripts/setup-local-db.sql
```

Or if you have a password set:
```bash
psql postgresql://postgres:postgres@localhost:5432/oneselai -f scripts/setup-local-db.sql
```

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
3. **Dashboard** - View your interview history and stats at `/dashboard`
4. **Start Interview** - Go to `/interview-ui` to begin a practice interview
5. **Upload Resume** - Upload your PDF resume for personalized questions
6. **View Results** - Check scores and feedback after each interview

---

## Database Schema

### PostgreSQL Tables
| Table | Purpose |
|-------|---------|
| `users` | User accounts (email, name, password hash) |
| `password_reset_tokens` | Password reset flow |
| `subscriptions` | User plan management (free/basic/pro) |
| `resumes` | Resume file metadata |
| `interview_sessions` | Interview session tracking |
| `interview_results` | Scores, feedback, metrics |
| `contact_submissions` | Contact form data |

### MongoDB Collections (auto-created)
| Collection | Purpose |
|------------|---------|
| `interview_sessions` | Session logs |
| `interview_logs` | Detailed interview transcripts |
| `emotion_batches` | Facial emotion raw data |
| `performance_reports` | Aggregated emotion metrics |
| `voice_batches` | Voice analysis raw data |
| `voice_reports` | Aggregated voice metrics |
| `text_sentiment_logs` | Text sentiment scores |
| `resumes` | Parsed resume text |
| `pre_interview_setup` | Pre-interview configuration |

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/register` | POST | User registration |
| `/api/login` | POST | User login |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/auth/change-password` | POST | Change password (authenticated) |
| `/api/profile` | GET/PUT | Get/update user profile |
| `/api/profile/change-password` | POST | Change password via profile |
| `/api/dashboard` | GET | Dashboard data with stats |
| `/api/dashboard-stats` | GET | Interview statistics |
| `/api/interview-session` | POST | Create interview session |
| `/api/interview-session/[id]` | GET | Get session details |
| `/api/interview/start` | POST | Start interview |
| `/api/interview/questions` | POST | Generate questions |
| `/api/interview/end` | POST | End interview, get score |
| `/api/interview-results` | GET/POST | Get/save results |
| `/api/interview-results/[id]` | GET | Get specific result |
| `/api/interview-score` | POST | Calculate interview score |
| `/api/qa/route` | POST | Generate Q&A |
| `/api/qa/generate` | POST | Generate questions from resume |
| `/api/emotion` | POST | Submit face emotion data |
| `/api/voice-emotion` | POST | Submit voice analysis data |
| `/api/text-sentiment` | POST | Analyze text sentiment |
| `/api/resume-upload` | POST/DELETE | Upload/delete resume |
| `/api/resume/parse` | POST | Parse resume PDF |
| `/api/contact` | POST | Submit contact form |
| `/api/subscriptions/check` | GET | Check subscription status |
| `/api/subscriptions/select-plan` | POST | Select subscription plan |

---

## Project Structure

```
oneselai-interview-prep-system/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/               # API endpoints
│   ├── dashboard/         # Dashboard page
│   ├── interview/         # Interview pages
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   └── profile/          # Profile pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── navbar.tsx         # Navigation bar
│   ├── footer.tsx         # Footer
│   └── ai-interviewer.tsx # AI interview component
├── lib/                   # Server utilities
│   ├── auth.ts           # JWT auth functions
│   ├── postgres.ts       # PostgreSQL connection
│   ├── scoring.ts        # Interview scoring logic
│   └── file-storage.ts   # File upload handling
├── utils/                 # Shared utilities
│   ├── mongodb.ts        # MongoDB connection
│   └── resumeAnalyzer.ts # Resume text analysis
├── scripts/              # Setup & migration scripts
│   ├── setup-local-db.sql # Complete DB schema
│   └── setup-local.js    # Automated setup script
├── .env.local            # Environment variables
├── .env.example          # Environment template
└── package.json          # Dependencies & scripts
```

---

## Available Scripts

```bash
npm run dev        # Start development server (http://localhost:3000)
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run db:setup   # Run PostgreSQL schema migration
```

---

## Troubleshooting

### "POSTGRES_URL environment variable is not set"
- Make sure `.env.local` exists with the correct PostgreSQL URL
- Default: `postgresql://postgres:postgres@localhost:5432/oneselai`

### "Cannot connect to PostgreSQL"
- Ensure PostgreSQL is running: `pg_isready`
- Check if the database exists: `psql -U postgres -l | grep oneselai`
- Create it if missing: `createdb oneselai`

### "MongoDB connection failed"
- Ensure MongoDB is running: `mongosh --eval "db.adminCommand('ping')"`
- Check the service: `brew services list` (macOS) or `systemctl status mongod` (Linux)

### "Module not found" errors
- Run `npm install` to ensure all dependencies are installed
- Delete `node_modules` and `.next`, then reinstall: `rm -rf node_modules .next && npm install`

### Resume upload fails
- Ensure the upload directories exist: `mkdir -p uploads/resumes public/uploads/resumes`
- Check file permissions on the uploads directory

---

## Verification Checklist

After setup, verify these work:

- [ ] `http://localhost:3000` loads the landing page
- [ ] Register a new account at `/register`
- [ ] Login with the account at `/login`
- [ ] Dashboard loads at `/dashboard`
- [ ] Profile page loads at `/profile`
- [ ] Interview setup works at `/interview-ui`
- [ ] Contact form submits at `/contact`
- [ ] `http://localhost:3000/api/debug-env` shows all env vars as SET
