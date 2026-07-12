-- EcoSphere ESG Platform - Initial Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- MASTER DATA TABLES
-- ============================================

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    head_name TEXT,
    parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    employee_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Categories (shared across Social & Gamification)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('CSR Activity', 'Challenge')),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Emission Factors
CREATE TABLE IF NOT EXISTS emission_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL,
    description TEXT,
    factor_value DECIMAL NOT NULL,
    unit TEXT NOT NULL,
    region TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Product ESG Profiles
CREATE TABLE IF NOT EXISTS product_esg_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL,
    carbon_footprint DECIMAL,
    recyclability_score DECIMAL,
    sustainability_rating TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Environmental Goals
CREATE TABLE IF NOT EXISTS environmental_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    target_value DECIMAL NOT NULL,
    current_value DECIMAL DEFAULT 0,
    unit TEXT NOT NULL,
    deadline DATE,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ESG Policies
CREATE TABLE IF NOT EXISTS esg_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    version TEXT DEFAULT '1.0',
    effective_date DATE,
    status TEXT DEFAULT 'Active',
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    unlock_rule JSONB NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Rewards
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    stock INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    avatar_url TEXT,
    xp INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TRANSACTIONAL DATA TABLES
-- ============================================

-- Carbon Transactions
CREATE TABLE IF NOT EXISTS carbon_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    emission_factor_id UUID REFERENCES emission_factors(id) ON DELETE SET NULL,
    source_type TEXT NOT NULL,
    quantity DECIMAL NOT NULL,
    calculated_emission DECIMAL NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    auto_calculated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- CSR Activities
CREATE TABLE IF NOT EXISTS csr_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    date DATE,
    max_participants INTEGER,
    points_reward INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Employee Participations (CSR Activities)
CREATE TABLE IF NOT EXISTS employee_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES csr_activities(id) ON DELETE CASCADE,
    proof_url TEXT,
    approval_status TEXT DEFAULT 'Pending' CHECK (approval_status IN ('Pending', 'Approved', 'Rejected')),
    points_earned INTEGER DEFAULT 0,
    completion_date DATE,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Challenges
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    xp_reward INTEGER DEFAULT 0,
    difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Expert')),
    evidence_required BOOLEAN DEFAULT false,
    deadline DATE,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Under Review', 'Completed', 'Archived')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Challenge Participations
CREATE TABLE IF NOT EXISTS challenge_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    proof_url TEXT,
    approval_status TEXT DEFAULT 'Pending' CHECK (approval_status IN ('Pending', 'Approved', 'Rejected')),
    xp_awarded INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Policy Acknowledgements
CREATE TABLE IF NOT EXISTS policy_acknowledgements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES esg_policies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    acknowledged_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(policy_id, employee_id)
);

-- Audits
CREATE TABLE IF NOT EXISTS audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    auditor TEXT,
    audit_date DATE,
    findings TEXT,
    status TEXT DEFAULT 'Planned' CHECK (status IN ('Planned', 'In Progress', 'Completed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Compliance Issues
CREATE TABLE IF NOT EXISTS compliance_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES audits(id) ON DELETE SET NULL,
    severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    description TEXT NOT NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Overdue')),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Department Scores
CREATE TABLE IF NOT EXISTS department_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE UNIQUE,
    environmental_score DECIMAL DEFAULT 0,
    social_score DECIMAL DEFAULT 0,
    governance_score DECIMAL DEFAULT 0,
    total_score DECIMAL DEFAULT 0,
    last_calculated TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Employee Badges (many-to-many)
CREATE TABLE IF NOT EXISTS employee_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(employee_id, badge_id)
);

-- Reward Redemptions
CREATE TABLE IF NOT EXISTS reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
    points_spent INTEGER NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT now()
);

-- ESG Settings (singleton)
CREATE TABLE IF NOT EXISTS esg_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    env_weight DECIMAL DEFAULT 0.40,
    social_weight DECIMAL DEFAULT 0.30,
    gov_weight DECIMAL DEFAULT 0.30,
    auto_emission_enabled BOOLEAN DEFAULT false,
    evidence_required BOOLEAN DEFAULT false,
    badge_auto_award BOOLEAN DEFAULT true,
    notification_email BOOLEAN DEFAULT false,
    notification_in_app BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_carbon_tx_dept ON carbon_transactions(department_id);
CREATE INDEX IF NOT EXISTS idx_carbon_tx_date ON carbon_transactions(date);
CREATE INDEX IF NOT EXISTS idx_participations_employee ON employee_participations(employee_id);
CREATE INDEX IF NOT EXISTS idx_participations_activity ON employee_participations(activity_id);
CREATE INDEX IF NOT EXISTS idx_challenge_parts_employee ON challenge_participations(employee_id);
CREATE INDEX IF NOT EXISTS idx_challenge_parts_challenge ON challenge_participations(challenge_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_issues(status);
CREATE INDEX IF NOT EXISTS idx_compliance_due ON compliance_issues(due_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp DESC);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP (Trigger)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create profile when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, update only their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Notifications: users see only their own
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Public read tables (no RLS needed for these - anyone authenticated can read)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Departments viewable by all" ON departments FOR SELECT USING (true);
CREATE POLICY "Admins manage departments" ON departments FOR ALL USING (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories viewable by all" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON categories FOR ALL USING (true);

ALTER TABLE emission_factors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "EF viewable by all" ON emission_factors FOR SELECT USING (true);
CREATE POLICY "Admins manage EF" ON emission_factors FOR ALL USING (true);

ALTER TABLE carbon_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CT viewable by all" ON carbon_transactions FOR SELECT USING (true);
CREATE POLICY "Admins manage CT" ON carbon_transactions FOR ALL USING (true);

ALTER TABLE environmental_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Goals viewable by all" ON environmental_goals FOR SELECT USING (true);
CREATE POLICY "Admins manage goals" ON environmental_goals FOR ALL USING (true);

ALTER TABLE esg_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Policies viewable by all" ON esg_policies FOR SELECT USING (true);
CREATE POLICY "Admins manage policies" ON esg_policies FOR ALL USING (true);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges viewable by all" ON badges FOR SELECT USING (true);
CREATE POLICY "Admins manage badges" ON badges FOR ALL USING (true);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rewards viewable by all" ON rewards FOR SELECT USING (true);
CREATE POLICY "Admins manage rewards" ON rewards FOR ALL USING (true);

ALTER TABLE csr_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CSR viewable by all" ON csr_activities FOR SELECT USING (true);
CREATE POLICY "Admins manage CSR" ON csr_activities FOR ALL USING (true);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges viewable by all" ON challenges FOR SELECT USING (true);
CREATE POLICY "Admins manage challenges" ON challenges FOR ALL USING (true);

ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audits viewable by all" ON audits FOR SELECT USING (true);
CREATE POLICY "Admins manage audits" ON audits FOR ALL USING (true);

ALTER TABLE compliance_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Issues viewable by all" ON compliance_issues FOR SELECT USING (true);
CREATE POLICY "Admins manage issues" ON compliance_issues FOR ALL USING (true);

ALTER TABLE department_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scores viewable by all" ON department_scores FOR SELECT USING (true);
CREATE POLICY "Admins manage scores" ON department_scores FOR ALL USING (true);

ALTER TABLE esg_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings viewable by all" ON esg_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON esg_settings FOR ALL USING (true);

-- Insert default settings
INSERT INTO esg_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE BUCKET for Evidence Files
-- ============================================
-- Run this separately in Supabase Dashboard > Storage:
-- Create bucket named 'evidence' with public access
