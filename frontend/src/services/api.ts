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

// Memory Cache Map
const apiCache: Record<string, any> = {};

// Helper to clear all cache keys
export const clearCache = () => {
  for (const key in apiCache) {
    delete apiCache[key];
  }
};

// Cached GET wrapper
const cachedGet = async (url: string, config?: any) => {
  const cacheKey = config?.params ? `${url}?${JSON.stringify(config.params)}` : url;
  if (apiCache[cacheKey]) {
    return apiCache[cacheKey];
  }
  const response = await api.get(url, config);
  apiCache[cacheKey] = response;
  return response;
};

// Mutating POST wrapper
const mutatingPost = async (url: string, data?: any, config?: any) => {
  clearCache();
  return api.post(url, data, config);
};

// Mutating PUT wrapper
const mutatingPut = async (url: string, data?: any, config?: any) => {
  clearCache();
  return api.put(url, data, config);
};

// Mutating DELETE wrapper
const mutatingDelete = async (url: string, config?: any) => {
  clearCache();
  return api.delete(url, config);
};

// ============================================
// Dashboard
// ============================================
export const getDashboard = () => cachedGet('/dashboard');

// ============================================
// Departments
// ============================================
export const getDepartments = () => cachedGet('/departments');
export const createDepartment = (data: Record<string, unknown>) => mutatingPost('/departments', data);
export const updateDepartment = (id: string, data: Record<string, unknown>) => mutatingPut(`/departments/${id}`, data);
export const deleteDepartment = (id: string) => mutatingDelete(`/departments/${id}`);

// ============================================
// Categories
// ============================================
export const getCategories = (type?: string) => cachedGet('/categories', { params: { type } });
export const createCategory = (data: Record<string, unknown>) => mutatingPost('/categories', data);
export const updateCategory = (id: string, data: Record<string, unknown>) => mutatingPut(`/categories/${id}`, data);
export const deleteCategory = (id: string) => mutatingDelete(`/categories/${id}`);

// ============================================
// Environmental
// ============================================
export const getEmissionFactors = () => cachedGet('/environmental/emission-factors');
export const createEmissionFactor = (data: Record<string, unknown>) => mutatingPost('/environmental/emission-factors', data);
export const updateEmissionFactor = (id: string, data: Record<string, unknown>) => mutatingPut(`/environmental/emission-factors/${id}`, data);
export const deleteEmissionFactor = (id: string) => mutatingDelete(`/environmental/emission-factors/${id}`);

export const getProductProfiles = () => cachedGet('/products');
export const createProductProfile = (data: Record<string, unknown>) => mutatingPost('/products', data);
export const updateProductProfile = (id: string, data: Record<string, unknown>) => mutatingPut(`/products/${id}`, data);
export const deleteProductProfile = (id: string) => mutatingDelete(`/products/${id}`);

export const getCarbonTransactions = (params?: Record<string, string>) => cachedGet('/environmental/carbon-transactions', { params });
export const createCarbonTransaction = (data: Record<string, unknown>) => mutatingPost('/environmental/carbon-transactions', data);

export const getEnvironmentalGoals = () => cachedGet('/environmental/goals');
export const createEnvironmentalGoal = (data: Record<string, unknown>) => mutatingPost('/environmental/goals', data);
export const updateEnvironmentalGoal = (id: string, data: Record<string, unknown>) => mutatingPut(`/environmental/goals/${id}`, data);

export const getEnvironmentalDashboard = () => cachedGet('/environmental/dashboard');

// ============================================
// Social
// ============================================
export const getCSRActivities = () => cachedGet('/social/csr-activities');
export const createCSRActivity = (data: Record<string, unknown>) => mutatingPost('/social/csr-activities', data);
export const updateCSRActivity = (id: string, data: Record<string, unknown>) => mutatingPut(`/social/csr-activities/${id}`, data);
export const deleteCSRActivity = (id: string) => mutatingDelete(`/social/csr-activities/${id}`);

export const getParticipations = (activityId?: string) => cachedGet('/social/participations', { params: { activity_id: activityId } });
export const createParticipation = (data: Record<string, unknown>) => mutatingPost('/social/participations', data);
export const approveParticipation = (id: string, status: string) => mutatingPut(`/social/participations/${id}/approve`, { approval_status: status });

export const getDiversityMetrics = () => cachedGet('/social/diversity');

export const getTrainingCompletions = () => cachedGet('/social/training');
export const createTrainingCompletion = (data: Record<string, unknown>) => mutatingPost('/social/training', data);
export const deleteTrainingCompletion = (id: string) => mutatingDelete(`/social/training/${id}`);

// ============================================
// Governance
// ============================================
export const getPolicies = () => cachedGet('/governance/policies');
export const createPolicy = (data: Record<string, unknown>) => mutatingPost('/governance/policies', data);
export const updatePolicy = (id: string, data: Record<string, unknown>) => mutatingPut(`/governance/policies/${id}`, data);
export const deletePolicy = (id: string) => mutatingDelete(`/governance/policies/${id}`);

export const acknowledgePolicy = (policyId: string) => mutatingPost('/governance/policy-acknowledgements', null, { params: { policy_id: policyId } });
export const getAcknowledgements = (policyId?: string) => cachedGet('/governance/policy-acknowledgements', { params: { policy_id: policyId } });

export const getAudits = () => cachedGet('/governance/audits');
export const createAudit = (data: Record<string, unknown>) => mutatingPost('/governance/audits', data);
export const updateAudit = (id: string, data: Record<string, unknown>) => mutatingPut(`/governance/audits/${id}`, data);

export const getComplianceIssues = (params?: Record<string, string>) => cachedGet('/governance/compliance-issues', { params });
export const createComplianceIssue = (data: Record<string, unknown>) => mutatingPost('/governance/compliance-issues', data);
export const updateComplianceIssue = (id: string, data: Record<string, unknown>) => mutatingPut(`/governance/compliance-issues/${id}`, data);

// ============================================
// Gamification
// ============================================
export const getChallenges = (status?: string) => cachedGet('/gamification/challenges', { params: { status } });
export const createChallenge = (data: Record<string, unknown>) => mutatingPost('/gamification/challenges', data);
export const updateChallenge = (id: string, data: Record<string, unknown>) => mutatingPut(`/gamification/challenges/${id}`, data);
export const updateChallengeStatus = (id: string, status: string) => mutatingPut(`/gamification/challenges/${id}/status`, null, { params: { new_status: status } });

export const getChallengeParticipations = (challengeId?: string) => cachedGet('/gamification/challenge-participations', { params: { challenge_id: challengeId } });
export const joinChallenge = (data: Record<string, unknown>) => mutatingPost('/gamification/challenge-participations', data);
export const approveChallengeParticipation = (id: string, status: string) => mutatingPut(`/gamification/challenge-participations/${id}/approve`, null, { params: { approval_status: status } });

export const getBadges = () => cachedGet('/gamification/badges');
export const getMyBadges = () => cachedGet('/gamification/badges/my');
export const createBadge = (data: Record<string, unknown>) => mutatingPost('/gamification/badges', data);

export const getRewards = () => cachedGet('/gamification/rewards');
export const createReward = (data: Record<string, unknown>) => mutatingPost('/gamification/rewards', data);
export const redeemReward = (id: string) => mutatingPost(`/gamification/rewards/${id}/redeem`);

export const getLeaderboard = () => cachedGet('/gamification/leaderboard');

// ============================================
// Reports
// ============================================
export const generateReport = (data: Record<string, unknown>) => api.post('/reports/generate', data, { responseType: 'blob' });

// ============================================
// Notifications
// ============================================
export const getNotifications = () => cachedGet('/notifications');
export const getUnreadCount = () => cachedGet('/notifications/unread-count');
export const markRead = (id: string) => mutatingPut(`/notifications/${id}/read`);
export const markAllRead = () => mutatingPut('/notifications/read-all');

// ============================================
// Settings
// ============================================
export const getSettings = () => cachedGet('/settings');
export const updateSettings = (data: Record<string, unknown>) => mutatingPut('/settings', data);

// ============================================
// Chatbot
// ============================================
export const queryChatbot = (message: string) => api.post('/chatbot/query', { message });

export default api;
