// ============================================
// EcoSphere ESG Platform - TypeScript Types
// ============================================

export interface Department {
  id: string;
  name: string;
  code: string;
  head_name: string | null;
  parent_department_id: string | null;
  employee_count: number;
  status: 'Active' | 'Inactive';
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'CSR Activity' | 'Challenge';
  status: 'Active' | 'Inactive';
}

export interface EmissionFactor {
  id: string;
  source_type: string;
  description: string | null;
  factor_value: number;
  unit: string;
  region: string | null;
  status: string;
}

export interface CarbonTransaction {
  id: string;
  department_id: string;
  emission_factor_id: string;
  source_type: string;
  quantity: number;
  calculated_emission: number;
  date: string;
  notes: string | null;
  auto_calculated: boolean;
  departments?: { name: string };
  emission_factors?: { source_type: string; unit: string };
}

export interface EnvironmentalGoal {
  id: string;
  department_id: string | null;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string | null;
  status: string;
  departments?: { name: string };
}

export interface ESGPolicy {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  version: string;
  effective_date: string | null;
  status: string;
  document_url: string | null;
}

export interface Audit {
  id: string;
  title: string;
  department_id: string | null;
  auditor: string | null;
  audit_date: string | null;
  findings: string | null;
  status: 'Planned' | 'In Progress' | 'Completed';
  departments?: { name: string };
}

export interface ComplianceIssue {
  id: string;
  audit_id: string | null;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  owner_id: string;
  due_date: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Overdue';
  resolution_notes: string | null;
  is_overdue?: boolean;
  audits?: { title: string };
  profiles?: { full_name: string };
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  unlock_rule: { type: string; value: number };
  status: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  stock: number;
  status: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  xp_reward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  evidence_required: boolean;
  deadline: string | null;
  status: 'Draft' | 'Active' | 'Under Review' | 'Completed' | 'Archived';
  categories?: { name: string };
}

export interface CSRActivity {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  department_id: string | null;
  date: string | null;
  max_participants: number | null;
  points_reward: number;
  status: string;
  categories?: { name: string };
  departments?: { name: string };
}

export interface EmployeeParticipation {
  id: string;
  employee_id: string;
  activity_id: string;
  proof_url: string | null;
  approval_status: 'Pending' | 'Approved' | 'Rejected';
  points_earned: number;
  completion_date: string | null;
  profiles?: { full_name: string; email: string };
  csr_activities?: { title: string };
}

export interface ChallengeParticipation {
  id: string;
  challenge_id: string;
  employee_id: string;
  progress: number;
  proof_url: string | null;
  approval_status: 'Pending' | 'Approved' | 'Rejected';
  xp_awarded: number;
  completed_at: string | null;
  profiles?: { full_name: string; email: string };
  challenges?: { title: string; xp_reward: number };
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'employee';
  department_id: string | null;
  avatar_url: string | null;
  xp: number;
  points: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string | null;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface DepartmentScore {
  id: string;
  department_id: string;
  environmental_score: number;
  social_score: number;
  governance_score: number;
  total_score: number;
  departments?: { name: string; code: string };
}

export interface ESGSettings {
  id: number;
  env_weight: number;
  social_weight: number;
  gov_weight: number;
  auto_emission_enabled: boolean;
  evidence_required: boolean;
  badge_auto_award: boolean;
  notification_email: boolean;
  notification_in_app: boolean;
}

export interface DashboardData {
  overall_score: number;
  environmental_score: number;
  social_score: number;
  governance_score: number;
  weights: { environmental: number; social: number; governance: number };
  total_emissions: number;
  active_challenges: number;
  total_challenges: number;
  open_compliance_issues: number;
  critical_issues: number;
  active_csr_activities: number;
  total_employees: number;
  department_rankings: DepartmentScore[];
  emission_trend: Record<string, number>;
  goals: EnvironmentalGoal[];
}

export interface ProductESGProfile {
  id: string;
  product_name: string;
  carbon_footprint: number | null;
  recyclability_score: number | null;
  sustainability_rating: string | null;
  notes: string | null;
  created_at: string;
}

export interface TrainingCompletion {
  id: string;
  employee_id: string;
  training_name: string;
  completed_at: string;
  score: number | null;
  status: 'Completed' | 'In Progress' | 'Failed';
  profiles?: {
    full_name: string;
    email: string;
  };
}
