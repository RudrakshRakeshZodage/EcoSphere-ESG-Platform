import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const EcoLogo: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.6))' }}>
    <defs>
      <linearGradient id="logo-grad-reset" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="50%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" stroke="url(#logo-grad-reset)" strokeWidth="6" strokeDasharray="3 3" opacity="0.3" />
    <path d="M50 15C30.67 15 15 30.67 15 50C15 63.8 22.99 75.76 34.6 81.56C34.85 81.68 35.15 81.65 35.37 81.48C35.59 81.3 35.7 81.02 35.68 80.74C35.1 73.18 39.2 65.85 45.9 62.43C48.47 61.12 51.53 61.12 54.1 62.43C60.8 65.85 64.9 73.18 64.32 80.74C64.3 81.02 64.41 81.3 64.63 81.48C64.85 81.65 65.15 81.68 65.4 81.56C77.01 75.76 85 63.8 85 50C85 30.67 69.33 15 50 15Z" fill="url(#logo-grad-reset)" />
    <path d="M50 32C45.58 32 42 35.58 42 40C42 44.42 45.58 48 50 48C54.42 48 58 44.42 58 40C58 35.58 54.42 32 50 32Z" fill="#ffffff" />
  </svg>
);

export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: '#020617',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 10000,
      fontFamily: "'Inter', sans-serif"
    }}>
      <Card 
        style={{ width: '100%', maxWidth: '400px', padding: '40px 30px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
        title={
          <div style={{ textAlign: 'center', width: '100%', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              <EcoLogo />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Reset Password</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
              Enter your new secure account password
            </p>
          </div>
        }
      >
        {success ? (
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: '#34d399',
            fontSize: '0.9rem',
            textAlign: 'center',
            lineHeight: 1.5
          }}>
            Password updated successfully! Redirecting you to the login screen...
          </div>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                New Password
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
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={loading} style={{ padding: '12px', fontSize: '0.95rem', marginTop: '10px' }}>
              {loading ? 'Updating Password...' : 'Save Password'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};
