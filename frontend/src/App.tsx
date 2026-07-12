import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ResetPassword } from './pages/auth/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { EmissionFactors } from './pages/environmental/EmissionFactors';
import { ProductProfiles } from './pages/environmental/ProductProfiles';
import { CarbonTransactions } from './pages/environmental/CarbonTransactions';
import { Goals } from './pages/environmental/Goals';
import { CsrActivities } from './pages/social/CsrActivities';
import { Participations } from './pages/social/Participations';
import { DiversityMetrics } from './pages/social/DiversityMetrics';
import { TrainingCompletions } from './pages/social/TrainingCompletions';
import { Policies } from './pages/governance/Policies';
import { Audits } from './pages/governance/Audits';
import { ComplianceIssues } from './pages/governance/ComplianceIssues';
import { Challenges } from './pages/gamification/Challenges';
import { Badges } from './pages/gamification/Badges';
import { Rewards } from './pages/gamification/Rewards';
import { Leaderboard } from './pages/gamification/Leaderboard';
import { ReportBuilder } from './pages/reports/ReportBuilder';
import { Settings } from './pages/settings/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '40px' }}>Checking session...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected dashboard and core modules */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      
      {/* Environmental */}
      <Route path="/environmental/emission-factors" element={<ProtectedRoute><EmissionFactors /></ProtectedRoute>} />
      <Route path="/environmental/product-profiles" element={<ProtectedRoute><ProductProfiles /></ProtectedRoute>} />
      <Route path="/environmental/carbon-transactions" element={<ProtectedRoute><CarbonTransactions /></ProtectedRoute>} />
      <Route path="/environmental/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />

      {/* Social */}
      <Route path="/social/csr-activities" element={<ProtectedRoute><CsrActivities /></ProtectedRoute>} />
      <Route path="/social/participations" element={<ProtectedRoute><Participations /></ProtectedRoute>} />
      <Route path="/social/diversity" element={<ProtectedRoute><DiversityMetrics /></ProtectedRoute>} />
      <Route path="/social/training" element={<ProtectedRoute><TrainingCompletions /></ProtectedRoute>} />

      {/* Governance */}
      <Route path="/governance/policies" element={<ProtectedRoute><Policies /></ProtectedRoute>} />
      <Route path="/governance/audits" element={<ProtectedRoute><Audits /></ProtectedRoute>} />
      <Route path="/governance/compliance-issues" element={<ProtectedRoute><ComplianceIssues /></ProtectedRoute>} />

      {/* Gamification */}
      <Route path="/gamification/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
      <Route path="/gamification/badges" element={<ProtectedRoute><Badges /></ProtectedRoute>} />
      <Route path="/gamification/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
      <Route path="/gamification/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />

      {/* Analytics & Settings */}
      <Route path="/reports" element={<ProtectedRoute><ReportBuilder /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
