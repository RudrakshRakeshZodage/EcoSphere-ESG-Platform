import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
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
      background: 'var(--bg-gradient)',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 10000
    }}>
      <Card 
        style={{ width: '100%', maxWidth: '400px', padding: '40px 30px' }}
        title={
          <div style={{ textAlign: 'center', width: '100%', marginBottom: '10px' }}>
            <div style={{
              width: '45px',
              height: '45px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#fff',
              fontSize: '1.4rem',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
              marginBottom: '15px'
            }}>
              ES
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>Welcome Back</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
              EcoSphere ESG Platform Login
            </p>
          </div>
        }
      >
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

          <Button type="submit" disabled={loading} style={{ width: '100%', padding: '12px' }}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '10px' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>
              Sign Up
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
};
