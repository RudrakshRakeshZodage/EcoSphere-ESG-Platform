# EcoSphere: Corporate ESG Management Platform

EcoSphere is a production-ready, full-stack ESG (Environmental, Social, Governance) Management Platform that helps organizations measure, track, and improve their sustainability metrics through gamified employee engagement.

---

## Technical Architecture

- **Frontend**: React 18, Vite, TypeScript, Chart.js, Vanilla CSS Design System (Premium Glassmorphic Dark UI)
- **Backend**: FastAPI (Python), Supabase client validation, report generators (PDF/Excel/CSV)
- **Database / BaaS**: Supabase (PostgreSQL, Realtime subscriptions, Storage buckets, Row Level Security)

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+)
- A [Supabase](https://supabase.com/) account and project.

---

## Database Setup

1. Go to your **Supabase Dashboard** > **SQL Editor**.
2. Copy the contents of the schema file: `supabase/migrations/001_initial_schema.sql` and execute it.
3. Copy the contents of the seed data file: `supabase/seed.sql` and execute it to populate demo departments, categories, and emission factors.
4. Go to **Storage** and create a new public bucket named `evidence`.

---

## Configuration

Create a `.env` file at the **project root** containing your Supabase details (reference `.env.example`):

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_API_URL=http://localhost:8000/api

# Backend
SECRET_KEY=your-jwt-signing-secret
CORS_ORIGINS=http://localhost:5173
```

---

## Running the Platform

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
The backend API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Frontend (React + Vite)

Open a new terminal window:

```bash
cd frontend
npm install
npm run dev
```
The application will run at [http://localhost:5173](http://localhost:5173).

---

## Verification & Tests

### Automated Check
To verify type correctness and packaging:
```bash
# Frontend
cd frontend && npm run build
```