# <p align="center"><img src="logo.svg" width="40" height="40" align="center" style="vertical-align: middle; margin-right: 10px;" /> EcoSphere: Corporate ESG Management & Engagement Platform</p>

<p align="center">
  <strong>EcoSphere</strong> is a premium, full-stack enterprise platform that integrates Environmental, Social, and Governance (ESG) tracking directly into daily ERP operations, driving corporate sustainability through interactive employee gamification.
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="#"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
  <a href="#"><img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="#"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="MIT License" /></a>
</p>


## 📊 Workflow: Challenge & Badge Auto-Unlock Engine

The sequence diagram below displays the real-time workflow for employees completing ESG challenges, database updates, and automated badge progression:

```mermaid
sequenceDiagram
    autonumber
    actor Employee as Employee (UI)
    participant FE as React Frontend
    participant BE as FastAPI Backend
    participant DB as Supabase PostgreSQL
    
    Employee->>FE: Submit Challenge Proof (Upload File)
    FE->>BE: POST /api/gamification/participate (Proof URL)
    BE->>DB: INSERT challenge_participations (Status: Under Review)
    Note over DB: Database RLS Validation
    DB-->>BE: Success
    
    actor Admin as Admin (Dashboard)
    Admin->>FE: Approve Participation
    FE->>BE: PUT /api/gamification/approve/{id}
    BE->>DB: UPDATE challenge_participations (Status: Approved)
    Note over DB: Auto-adds Challenge XP to Profile
    DB-->>BE: Success
    
    Note over BE: Check Auto-Award Policy
    BE->>DB: SELECT badges where unlock_rule <= profile.xp
    DB-->>BE: Qualifying Badges
    BE->>DB: INSERT INTO employee_badges (awarded_at)
    
    BE-->>FE: Return Approval & Badge Unlocks
    FE-->>Employee: Trigger XP Toast & Badge Earned Animation!
```

---

## 🚀 Core Modules

### 🍀 Environmental
*   **Emission Factors Engine**: Configure multipliers (Electricity, Diesel, Petrol, Manufacturing) to compute greenhouse gas (GHG) output.
*   **Product ESG Profiles**: Monitor individual product carbon footprints, recyclability percentages, and sustainability ratings.
*   **Carbon Accounting**: Log transactional corporate emissions by department.
*   **Goals Tracking**: Keep tabs on long-term net-zero goals.

### 👥 Social Impact
*   **CSR Activities**: Register community volunteering initiatives.
*   **Hours Tracking**: Log employee participation, hours contributed, and support uploads.
*   **Diversity Analytics**: Analyze corporate diversity metrics in real time.

### 🛡️ Governance & Compliance
*   **ESG Policies**: Distribute company codes of conduct.
*   **Policy Acknowledgements**: Log electronic employee sign-offs.
*   **Auditing & Compliance**: Raise issue tickets with assigned owners, due dates, and action histories.

### 🏆 Gamification
*   **XP & Points**: Earn experience points for taking sustainable actions.
*   **Leaderboard**: Monthly rankings of top-performing departments and employees.
*   **Badge Auto-Award**: Automatic badge unlocking when user milestone criteria are met.
*   **Rewards Catalog**: Redeem earned points for physical or digital eco-friendly rewards.

---

## ⚙️ Installation & Configuration

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18+)
*   [Python](https://www.python.org/) (v3.10+)
*   A [Supabase](https://supabase.com/) account.

### 1. Database Setup
1.  Navigate to your **Supabase Dashboard** > **SQL Editor**.
2.  Copy and execute the contents of [`supabase/migrations/001_initial_schema.sql`](file:///d:/Rudraksh/College/app/EcoSphere-ESG-Platform/supabase/migrations/001_initial_schema.sql) to set up tables, functions, and initial schema.
3.  Execute the seed script [`supabase/seed.sql`](file:///d:/Rudraksh/College/app/EcoSphere-ESG-Platform/supabase/seed.sql) to load initial categories and departments.
4.  Run the helper script [`scratch/enable_product_policies.sql`](file:///C:/Users/Rudraksh/.gemini/antigravity-ide/brain/3e133200-cf36-4f26-92c1-0a739c056788/scratch/enable_product_policies.sql) in your SQL editor to enable Product Profiles security policies.
5.  Create a public storage bucket in Supabase named `evidence`.

### 2. Configuration Setup
Create a `.env` file at the **project root** containing:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_API_URL=http://localhost:8000/api

SECRET_KEY=your-jwt-signing-secret
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

Copy the `.env` file into the `/frontend` directory to allow Vite to initialize correctly.

### 3. Execution

#### Backend (FastAPI)
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
Interactive docs will load at [http://localhost:8000/docs](http://localhost:8000/docs).

#### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
The dev server will run on [http://localhost:5173](http://localhost:5173) or [http://localhost:5174](http://localhost:5174).

---

## 🔒 Security Architecture
All data transactions are governed via **PostgreSQL Row Level Security (RLS)** to enforce corporate compliance:
*   **Profiles**: Public reading; updates allowed only by owner or admins.
*   **Carbon Ledger**: Selectable by anyone; mutable only by Admin roles.
*   **Gamification Redemptions**: Handled via transaction locks to prevent double-spending points during reward redemptions.
<!-- deploy trigger: 1 -->