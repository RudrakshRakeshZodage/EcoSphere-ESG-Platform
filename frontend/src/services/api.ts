import axios from 'axios';
import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// ============================================
// Dashboard
// ============================================
export const getDashboard = () => api.get('/dashboard');

// ============================================
// Departments
// ============================================
export const getDepartments = () => api.get('/departments');
export const createDepartment = (data: Record<string, unknown>) => api.post('/departments', data);
export const updateDepartment = (id: string, data: Record<string, unknown>) => api.put(`/departments/${id}`, data);
export const deleteDepartment = (id: string) => api.delete(`/departments/${id}`);

// ============================================
// Categories
// ============================================
export const getCategories = (type?: string) => api.get('/categories', { params: { type } });
export const createCategory = (data: Record<string, unknown>) => api.post('/categories', data);
export const updateCategory = (id: string, data: Record<string, unknown>) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id: string) => api.delete(`/categories/${id}`);

// ============================================
// Environmental
// ============================================
export const getEmissionFactors = () => api.get('/environmental/emission-factors');
export const createEmissionFactor = (data: Record<string, unknown>) => api.post('/environmental/emission-factors', data);
export const updateEmissionFactor = (id: string, data: Record<string, unknown>) => api.put(`/environmental/emission-factors/${id}`, data);
export const deleteEmissionFactor = (id: string) => api.delete(`/environmental/emission-factors/${id}`);

export const getProductProfiles = () => api.get('/products');
export const createProductProfile = (data: Record<string, unknown>) => api.post('/products', data);
export const updateProductProfile = (id: string, data: Record<string, unknown>) => api.put(`/products/${id}`, data);
export const deleteProductProfile = (id: string) => api.delete(`/products/${id}`);

export const getCarbonTransactions = (params?: Record<string, string>) => api.get('/environmental/carbon-transactions', { params });
export const createCarbonTransaction = (data: Record<string, unknown>) => api.post('/environmental/carbon-transactions', data);

export const getEnvironmentalGoals = () => api.get('/environmental/goals');
export const createEnvironmentalGoal = (data: Record<string, unknown>) => api.post('/environmental/goals', data);
export const updateEnvironmentalGoal = (id: string, data: Record<string, unknown>) => api.put(`/environmental/goals/${id}`, data);

export const getEnvironmentalDashboard = () => api.get('/environmental/dashboard');

// ============================================
// Social
// ============================================
export const getCSRActivities = () => api.get('/social/csr-activities');
export const createCSRActivity = (data: Record<string, unknown>) => api.post('/social/csr-activities', data);
export const updateCSRActivity = (id: string, data: Record<string, unknown>) => api.put(`/social/csr-activities/${id}`, data);
export const deleteCSRActivity = (id: string) => api.delete(`/social/csr-activities/${id}`);

export const getParticipations = (activityId?: string) => api.get('/social/participations', { params: { activity_id: activityId } });
export const createParticipation = (data: Record<string, unknown>) => api.post('/social/participations', data);
export const approveParticipation = (id: string, status: string) => api.put(`/social/participations/${id}/approve`, { approval_status: status });

export const getDiversityMetrics = () => api.get('/social/diversity');

// ============================================
// Governance
// ============================================
export const getPolicies = () => api.get('/governance/policies');
export const createPolicy = (data: Record<string, unknown>) => api.post('/governance/policies', data);
export const updatePolicy = (id: string, data: Record<string, unknown>) => api.put(`/governance/policies/${id}`, data);
export const deletePolicy = (id: string) => api.delete(`/governance/policies/${id}`);

export const acknowledgePolicy = (policyId: string) => api.post('/governance/policy-acknowledgements', null, { params: { policy_id: policyId } });
export const getAcknowledgements = (policyId?: string) => api.get('/governance/policy-acknowledgements', { params: { policy_id: policyId } });

export const getAudits = () => api.get('/governance/audits');
export const createAudit = (data: Record<string, unknown>) => api.post('/governance/audits', data);
export const updateAudit = (id: string, data: Record<string, unknown>) => api.put(`/governance/audits/${id}`, data);

export const getComplianceIssues = (params?: Record<string, string>) => api.get('/governance/compliance-issues', { params });
export const createComplianceIssue = (data: Record<string, unknown>) => api.post('/governance/compliance-issues', data);
export const updateComplianceIssue = (id: string, data: Record<string, unknown>) => api.put(`/governance/compliance-issues/${id}`, data);

// ============================================
// Gamification
// ============================================
export const getChallenges = (status?: string) => api.get('/gamification/challenges', { params: { status } });
export const createChallenge = (data: Record<string, unknown>) => api.post('/gamification/challenges', data);
export const updateChallenge = (id: string, data: Record<string, unknown>) => api.put(`/gamification/challenges/${id}`, data);
export const updateChallengeStatus = (id: string, status: string) => api.put(`/gamification/challenges/${id}/status`, null, { params: { new_status: status } });

export const getChallengeParticipations = (challengeId?: string) => api.get('/gamification/challenge-participations', { params: { challenge_id: challengeId } });
export const joinChallenge = (data: Record<string, unknown>) => api.post('/gamification/challenge-participations', data);
export const approveChallengeParticipation = (id: string, status: string) => api.put(`/gamification/challenge-participations/${id}/approve`, null, { params: { approval_status: status } });

export const getBadges = () => api.get('/gamification/badges');
export const getMyBadges = () => api.get('/gamification/badges/my');
export const createBadge = (data: Record<string, unknown>) => api.post('/gamification/badges', data);

export const getRewards = () => api.get('/gamification/rewards');
export const createReward = (data: Record<string, unknown>) => api.post('/gamification/rewards', data);
export const redeemReward = (id: string) => api.post(`/gamification/rewards/${id}/redeem`);

export const getLeaderboard = () => api.get('/gamification/leaderboard');

// ============================================
// Reports
// ============================================
export const generateReport = (data: Record<string, unknown>) => api.post('/reports/generate', data, { responseType: 'blob' });

// ============================================
// Notifications
// ============================================
export const getNotifications = () => api.get('/notifications');
export const getUnreadCount = () => api.get('/notifications/unread-count');
export const markRead = (id: string) => api.put(`/notifications/${id}/read`);
export const markAllRead = () => api.put('/notifications/read-all');

// ============================================
// Settings
// ============================================
export const getSettings = () => api.get('/settings');
export const updateSettings = (data: Record<string, unknown>) => api.put('/settings', data);

export default api;
