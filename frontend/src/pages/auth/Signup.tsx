import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { getDepartments } from '../../services/api';
import type { Department } from '../../types';
import { Leaf, Users, Shield, Trophy, CheckCircle2 } from 'lucide-react';

const EcoLogo: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.6))' }}>
    <defs>
      <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="50%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" stroke="url(#logo-grad)" strokeWidth="6" strokeDasharray="3 3" opacity="0.3" />
    <path d="M50 15C30.67 15 15 30.67 15 50C15 63.8 22.99 75.76 34.6 81.56C34.85 81.68 35.15 81.65 35.37 81.48C35.59 81.3 35.7 81.02 35.68 80.74C35.1 73.18 39.2 65.85 45.9 62.43C48.47 61.12 51.53 61.12 54.1 62.43C60.8 65.85 64.9 73.18 64.32 80.74C64.3 81.02 64.41 81.3 64.63 81.48C64.85 81.65 65.15 81.68 65.4 81.56C77.01 75.76 85 63.8 85 50C85 30.67 69.33 15 50 15Z" fill="url(#logo-grad)" />
    <path d="M50 32C45.58 32 42 35.58 42 40C42 44.42 45.58 48 50 48C54.42 48 58 44.42 58 40C58 35.58 54.42 32 50 32Z" fill="#ffffff" />
  </svg>
);

export const Signup: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [role, setRole] = useState('employee');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch departments for dropdown
    const fetchDepts = async () => {
      // 1. Check if departments are cached in localStorage
      const cached = localStorage.getItem('ecosphere_departments');
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as Department[];
          setDepartments(parsed);
          if (parsed.length > 0) {
            setDepartmentId(parsed[0].id);
          }
        } catch (e) {
          console.error('Error parsing cached departments:', e);
        }
      }

      // 2. Fetch fresh departments from backend API
      try {
        const res = await getDepartments();
        const freshDepts = res.data.data as Department[];
        setDepartments(freshDepts);
        
        // Cache departments for offline/instant load use
        localStorage.setItem('ecosphere_departments', JSON.stringify(freshDepts));
        
        if (freshDepts.length > 0) {
          setDepartmentId(freshDepts[0].id);
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
        // 3. Fallback: If network fails and there is no cache, load default departments
        if (!cached) {
          const fallbackDepts: Department[] = [
            { id: '20bcdff1-fd5d-4c88-9b5f-90983c5c90bb', name: 'Engineering', code: 'ENG', employee_count: 45, status: 'Active', head_name: 'Rajesh Kumar', parent_department_id: null, created_at: new Date().toISOString() },
            { id: 'c22a999e-d4a5-44ba-a5eb-8f62dd4f79fa', name: 'Finance', code: 'FIN', employee_count: 18, status: 'Active', head_name: 'Sneha Reddy', parent_department_id: null, created_at: new Date().toISOString() },
            { id: 'c3cc6ddb-2778-4df3-b18d-d6a18d3cc063', name: 'Human Resources', code: 'HR', employee_count: 12, status: 'Active', head_name: 'Priya Sharma', parent_department_id: null, created_at: new Date().toISOString() },
            { id: 'dabec5f6-d67c-4e12-a20d-97d9d326ed70', name: 'Marketing', code: 'MKT', employee_count: 22, status: 'Active', head_name: 'Vikram Singh', parent_department_id: null, created_at: new Date().toISOString() },
            { id: 'db9045d4-fcf5-4234-9aed-c8f920a99457', name: 'Operations', code: 'OPS', employee_count: 30, status: 'Active', head_name: 'Amit Patel', parent_department_id: null, created_at: new Date().toISOString() },
            { id: 'e96e60b5-3bd6-4283-82e3-1e511a3f7431', name: 'Research & Development', code: 'R&D', employee_count: 15, status: 'Active', head_name: 'Ananya Gupta', parent_department_id: null, created_at: new Date().toISOString() }
          ];
          setDepartments(fallbackDepts);
          setDepartmentId(fallbackDepts[0].id);
        }
      }
    };
    fetchDepts();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            department_id: departmentId
          }
        }
      });
      if (signupError) throw signupError;

      // Update the user profile explicitly if trigger took time
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            department_id: departmentId || null
          })
          .eq('id', data.user.id);
        if (profileError) console.error('Profile update error:', profileError);
      }

      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-container" style={{
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr',
      minHeight: '100vh',
      width: '100vw',
      background: '#020617',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 10000,
      overflowY: 'auto'
    }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes float-particle {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.15; }
          50% { transform: translateY(-40px) translateX(20px); opacity: 0.5; }
          100% { transform: translateY(0px) translateX(0px); opacity: 0.15; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.12; transform: scale(1); }
          50% { opacity: 0.22; transform: scale(1.08); }
        }
        .landing-container {
          font-family: 'Inter', sans-serif;
        }
        .showcase-side {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 60px;
          background: radial-gradient(circle at 15% 25%, rgba(16, 185, 129, 0.09) 0%, transparent 50%),
                      radial-gradient(circle at 85% 75%, rgba(56, 189, 248, 0.06) 0%, transparent 50%);
          border-right: 1px solid rgba(255, 255, 255, 0.04);
          position: relative;
          overflow: hidden;
        }
        .auth-side {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.95), #020617);
          position: relative;
        }
        .glow-circle-1 {
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: #10b981;
          filter: blur(120px);
          top: 10%;
          left: 5%;
          animation: pulse-glow 8s infinite ease-in-out;
          pointer-events: none;
        }
        .glow-circle-2 {
          position: absolute;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: #38bdf8;
          filter: blur(110px);
          bottom: 15%;
          right: 5%;
          animation: pulse-glow 7s infinite ease-in-out alternate;
          pointer-events: none;
        }
        .particle {
          position: absolute;
          background: rgba(16, 185, 129, 0.4);
          border-radius: 50%;
          pointer-events: none;
          animation: float-particle 12s infinite ease-in-out;
        }
        .showcase-card {
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(12px);
          margin-top: 30px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          animation: float 6s infinite ease-in-out;
        }
        .module-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 40px;
        }
        .module-item {
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .module-item:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(16, 185, 129, 0.2);
          transform: translateY(-3px);
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.05);
        }
        @media (max-width: 1024px) {
          .landing-container {
            grid-template-columns: 1fr !important;
          }
          .showcase-side {
            display: none !important;
          }
        }
      `}</style>

      {/* Left side: Premium Landing Showcase */}
      <div className="showcase-side">
        <div className="glow-circle-1"></div>
        <div className="glow-circle-2"></div>
        
        {/* Floating Particles */}
        <div className="particle" style={{ top: '25%', left: '15%', width: '6px', height: '6px', animationDelay: '0s' }}></div>
        <div className="particle" style={{ top: '65%', left: '25%', width: '4px', height: '4px', animationDelay: '2s' }}></div>
        <div className="particle" style={{ top: '45%', left: '75%', width: '8px', height: '8px', animationDelay: '4s' }}></div>
        <div className="particle" style={{ top: '80%', left: '60%', width: '5px', height: '5px', animationDelay: '1s' }}></div>

        {/* Logo and Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', zIndex: 10 }}>
          <EcoLogo />
          <span style={{ 
            fontSize: '1.5rem', 
            fontWeight: 800, 
            color: '#fff', 
            letterSpacing: '0.5px',
            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            EcoSphere
          </span>
        </div>

        {/* Middle Showcase Content */}
        <div style={{ zIndex: 10, margin: '40px 0' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1.15,
            letterSpacing: '-1.5px'
          }}>
            Integrate <span style={{
              background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Sustainability</span> directly into your ERP.
          </h1>
          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            marginTop: '18px',
            lineHeight: 1.6,
            maxWidth: '520px'
          }}>
            Measure operational carbon emissions, motivate employees with interactive gamification, and monitor compliance—all within one unified enterprise dashboard.
          </p>

          {/* Module Cards Grid */}
          <div className="module-list">
            <div className="module-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399', marginBottom: '8px' }}>
                <Leaf size={18} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Environmental</h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Real-time carbon accounting, custom emission factors, and tracking sustainability targets.
              </p>
            </div>

            <div className="module-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', marginBottom: '8px' }}>
                <Users size={18} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Social Impact</h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Corporate CSR registration, employee volunteer hours, and diversity dashboard analytics.
              </p>
            </div>

            <div className="module-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#a78bfa', marginBottom: '8px' }}>
                <Shield size={18} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Governance</h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Acknowledge ethical policies, conduct ESG audits, and monitor compliance issues.
              </p>
            </div>

            <div className="module-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fbbf24', marginBottom: '8px' }}>
                <Trophy size={18} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Gamification</h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Engage staff through sustainability challenges, earn XP/points, badges, and rewards.
              </p>
            </div>
          </div>

          {/* Floating Live Metric Card */}
          <div className="showcase-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Live Corporate ESG Score
                </span>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                  82 <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>/ 100</span>
                </h2>
              </div>
              <div style={{
                background: 'rgba(52, 211, 153, 0.1)',
                color: '#34d399',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: '1px solid rgba(52, 211, 153, 0.2)'
              }}>
                ↑ 4.2% This Month
              </div>
            </div>
            <div style={{ display: 'flex', gap: '15px', marginTop: '16px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span>12,450 kg CO2e Saved</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span>94% Recyclability Rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', zIndex: 10 }}>
          © {new Date().getFullYear()} EcoSphere Inc.
        </div>
      </div>

      {/* Right side: Signup Form Panel */}
      <div className="auth-side">
        <Card 
          style={{ width: '100%', maxWidth: '420px', padding: '40px 30px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
          title={
            <div style={{ textAlign: 'center', width: '100%', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Create Account</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                Register your profile to start contributing
              </p>
            </div>
          }
        >
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.2)',
                color: '#f87171',
                fontSize: '0.85rem',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="John Doe"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required={departments.length > 0}
              >
                <option value="">Select a department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Account Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="employee">Employee</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <Button type="submit" disabled={loading} style={{ padding: '12px', fontSize: '0.95rem', marginTop: '10px' }}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          <div style={{
            textAlign: 'center',
            marginTop: '25px',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)'
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
