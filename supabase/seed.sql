-- EcoSphere ESG Platform - Seed Data
-- Run this AFTER the schema migration

-- Clean existing seeded data to prevent duplicates or unique constraint violations
TRUNCATE TABLE carbon_transactions, employee_participations, challenge_participations, 
               policy_acknowledgements, compliance_issues, department_scores, 
               environmental_goals, csr_activities, challenges, departments, 
               categories, emission_factors, esg_policies, badges, rewards CASCADE;

-- ============================================
-- DEPARTMENTS
-- ============================================
INSERT INTO departments (name, code, head_name, employee_count, status) VALUES
    ('Engineering', 'ENG', 'Rajesh Kumar', 45, 'Active'),
    ('Human Resources', 'HR', 'Priya Sharma', 12, 'Active'),
    ('Operations', 'OPS', 'Amit Patel', 30, 'Active'),
    ('Finance', 'FIN', 'Sneha Reddy', 18, 'Active'),
    ('Marketing', 'MKT', 'Vikram Singh', 22, 'Active'),
    ('Research & Development', 'R&D', 'Ananya Gupta', 15, 'Active');

-- ============================================
-- CATEGORIES
-- ============================================
INSERT INTO categories (name, type, status) VALUES
    ('Tree Plantation', 'CSR Activity', 'Active'),
    ('Blood Donation', 'CSR Activity', 'Active'),
    ('Community Cleanup', 'CSR Activity', 'Active'),
    ('Education Support', 'CSR Activity', 'Active'),
    ('Health & Wellness', 'CSR Activity', 'Active'),
    ('Energy Saving', 'Challenge', 'Active'),
    ('Waste Reduction', 'Challenge', 'Active'),
    ('Green Commute', 'Challenge', 'Active'),
    ('Water Conservation', 'Challenge', 'Active'),
    ('Digital Sustainability', 'Challenge', 'Active');

-- ============================================
-- EMISSION FACTORS
-- ============================================
INSERT INTO emission_factors (source_type, description, factor_value, unit, region, status) VALUES
    ('Electricity', 'Grid electricity consumption', 0.82, 'kWh', 'India', 'Active'),
    ('Natural Gas', 'Natural gas combustion', 2.04, 'cubic meter', 'Global', 'Active'),
    ('Diesel Fleet', 'Diesel vehicle fleet', 2.68, 'liter', 'Global', 'Active'),
    ('Petrol Fleet', 'Petrol vehicle fleet', 2.31, 'liter', 'Global', 'Active'),
    ('Air Travel', 'Domestic air travel', 0.255, 'km per passenger', 'Global', 'Active'),
    ('Paper', 'Paper consumption', 1.84, 'kg', 'Global', 'Active'),
    ('Water', 'Water usage', 0.344, 'cubic meter', 'Global', 'Active'),
    ('Manufacturing', 'General manufacturing process', 5.20, 'unit produced', 'India', 'Active');

-- ============================================
-- ESG POLICIES
-- ============================================
INSERT INTO esg_policies (title, description, category, version, effective_date, status) VALUES
    ('Environmental Sustainability Policy', 'Company-wide policy for reducing carbon footprint and promoting sustainable practices across all operations.', 'Environmental', '2.0', '2024-01-01', 'Active'),
    ('Diversity & Inclusion Policy', 'Commitment to fostering a diverse and inclusive workplace environment for all employees.', 'Social', '1.5', '2024-03-15', 'Active'),
    ('Anti-Corruption & Ethics Policy', 'Standards for ethical business conduct, anti-bribery measures, and transparency in operations.', 'Governance', '3.0', '2024-01-01', 'Active'),
    ('Data Privacy & Protection Policy', 'Guidelines for handling personal data in compliance with applicable regulations.', 'Governance', '2.1', '2024-06-01', 'Active'),
    ('Employee Well-being Policy', 'Framework for supporting physical and mental health of all employees.', 'Social', '1.0', '2024-04-01', 'Active'),
    ('Waste Management Policy', 'Procedures for waste reduction, recycling, and responsible disposal.', 'Environmental', '1.2', '2024-02-01', 'Active');

-- ============================================
-- BADGES
-- ============================================
INSERT INTO badges (name, description, icon_url, unlock_rule, status) VALUES
    ('Eco Starter', 'Complete your first sustainability challenge', NULL, '{"type": "challenge_count", "value": 1}', 'Active'),
    ('Green Champion', 'Earn 500 XP through ESG activities', NULL, '{"type": "xp_threshold", "value": 500}', 'Active'),
    ('Sustainability Hero', 'Earn 2000 XP through ESG activities', NULL, '{"type": "xp_threshold", "value": 2000}', 'Active'),
    ('Team Player', 'Complete 5 CSR activities', NULL, '{"type": "challenge_count", "value": 5}', 'Active'),
    ('ESG Master', 'Earn 5000 XP — the pinnacle of sustainability', NULL, '{"type": "xp_threshold", "value": 5000}', 'Active'),
    ('Trailblazer', 'Complete 10 challenges', NULL, '{"type": "challenge_count", "value": 10}', 'Active');

-- ============================================
-- REWARDS
-- ============================================
INSERT INTO rewards (name, description, points_required, stock, status) VALUES
    ('Eco-Friendly Water Bottle', 'Reusable stainless steel water bottle with EcoSphere branding', 200, 50, 'Active'),
    ('Plant a Tree Certificate', 'We plant a tree in your name through our NGO partner', 100, 999, 'Active'),
    ('Extra Day Off', 'One additional paid day off to recharge', 1000, 10, 'Active'),
    ('Sustainable Gift Hamper', 'Curated hamper with eco-friendly products', 500, 25, 'Active'),
    ('Conference Ticket', 'Ticket to a sustainability conference of your choice', 2000, 5, 'Active'),
    ('Charity Donation', 'We donate ₹500 to a charity of your choice', 300, 999, 'Active');

-- ============================================
-- ENVIRONMENTAL GOALS
-- ============================================
INSERT INTO environmental_goals (department_id, title, target_value, current_value, unit, deadline, status)
SELECT d.id, goal.title, goal.target_value, goal.current_value, goal.unit, goal.deadline::date, 'Active'
FROM departments d
CROSS JOIN (VALUES
    ('Reduce carbon emissions by 20%', 20, 8.5, 'percent', '2025-12-31'),
    ('Zero paper waste', 100, 65, 'percent', '2025-06-30')
) AS goal(title, target_value, current_value, unit, deadline)
WHERE d.code = 'ENG';

INSERT INTO environmental_goals (title, target_value, current_value, unit, deadline, status) VALUES
    ('Company-wide 30% emission reduction', 30, 12, 'percent', '2026-12-31', 'Active'),
    ('100% renewable energy in offices', 100, 42, 'percent', '2026-06-30', 'Active');

-- ============================================
-- SAMPLE CARBON TRANSACTIONS
-- ============================================
INSERT INTO carbon_transactions (department_id, emission_factor_id, source_type, quantity, calculated_emission, date, notes)
SELECT
    d.id,
    ef.id,
    ef.source_type,
    CASE ef.source_type
        WHEN 'Electricity' THEN 15000
        WHEN 'Diesel Fleet' THEN 800
        WHEN 'Natural Gas' THEN 500
        ELSE 100
    END,
    CASE ef.source_type
        WHEN 'Electricity' THEN 15000 * ef.factor_value
        WHEN 'Diesel Fleet' THEN 800 * ef.factor_value
        WHEN 'Natural Gas' THEN 500 * ef.factor_value
        ELSE 100 * ef.factor_value
    END,
    '2025-01-15',
    'Monthly consumption record'
FROM departments d
CROSS JOIN emission_factors ef
WHERE d.code = 'OPS' AND ef.source_type IN ('Electricity', 'Diesel Fleet', 'Natural Gas');

-- ============================================
-- SAMPLE CSR ACTIVITIES
-- ============================================
INSERT INTO csr_activities (title, description, category_id, date, max_participants, points_reward, status)
SELECT
    activity.title,
    activity.description,
    c.id,
    activity.date::date,
    activity.max_participants,
    activity.points_reward,
    'Active'
FROM categories c
JOIN (VALUES
    ('Tree Plantation', 'Annual Tree Plantation Drive', 'Join us for planting 500 trees in the city park', '2025-03-22', 100, 150),
    ('Blood Donation', 'Quarterly Blood Donation Camp', 'Partner with Red Cross for blood donation drive', '2025-02-14', 50, 200),
    ('Community Cleanup', 'Beach Cleanup Initiative', 'Volunteer for the coastal cleanup program', '2025-04-22', 75, 120),
    ('Education Support', 'Teach a Child Program', 'Weekend teaching sessions at local NGO schools', '2025-01-15', 30, 180)
) AS activity(category_name, title, description, date, max_participants, points_reward)
ON c.name = activity.category_name AND c.type = 'CSR Activity';

-- ============================================
-- SAMPLE CHALLENGES
-- ============================================
INSERT INTO challenges (title, description, category_id, xp_reward, difficulty, evidence_required, deadline, status)
SELECT
    ch.title,
    ch.description,
    c.id,
    ch.xp_reward,
    ch.difficulty,
    ch.evidence_required,
    ch.deadline::date,
    ch.status
FROM categories c
JOIN (VALUES
    ('Energy Saving', 'No AC Friday', 'Skip air conditioning every Friday for a month', 150, 'Medium', true, '2025-06-30', 'Active'),
    ('Waste Reduction', 'Zero Plastic Week', 'Go an entire week without using single-use plastic', 200, 'Hard', true, '2025-05-31', 'Active'),
    ('Green Commute', 'Cycle to Work Challenge', 'Commute by bicycle for 10 days this month', 300, 'Hard', true, '2025-07-31', 'Active'),
    ('Water Conservation', 'Water Audit Challenge', 'Conduct a water audit at your workspace and submit findings', 250, 'Medium', true, '2025-08-31', 'Active'),
    ('Digital Sustainability', 'Email Cleanup Drive', 'Delete 1000 unnecessary emails to reduce digital carbon footprint', 100, 'Easy', false, '2025-12-31', 'Active')
) AS ch(category_name, title, description, xp_reward, difficulty, evidence_required, deadline, status)
ON c.name = ch.category_name AND c.type = 'Challenge';

-- ============================================
-- SAMPLE DEPARTMENT SCORES
-- ============================================
INSERT INTO department_scores (department_id, environmental_score, social_score, governance_score, total_score)
SELECT id,
    CASE code
        WHEN 'ENG' THEN 78
        WHEN 'HR' THEN 65
        WHEN 'OPS' THEN 72
        WHEN 'FIN' THEN 80
        WHEN 'MKT' THEN 68
        WHEN 'R&D' THEN 85
    END,
    CASE code
        WHEN 'ENG' THEN 82
        WHEN 'HR' THEN 90
        WHEN 'OPS' THEN 70
        WHEN 'FIN' THEN 75
        WHEN 'MKT' THEN 85
        WHEN 'R&D' THEN 72
    END,
    CASE code
        WHEN 'ENG' THEN 88
        WHEN 'HR' THEN 85
        WHEN 'OPS' THEN 78
        WHEN 'FIN' THEN 92
        WHEN 'MKT' THEN 80
        WHEN 'R&D' THEN 75
    END,
    CASE code
        WHEN 'ENG' THEN 82
        WHEN 'HR' THEN 80
        WHEN 'OPS' THEN 73
        WHEN 'FIN' THEN 82
        WHEN 'MKT' THEN 77
        WHEN 'R&D' THEN 77
    END
FROM departments;
