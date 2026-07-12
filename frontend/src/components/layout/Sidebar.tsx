import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clearCache } from '../../services/api';
import { 
  LayoutDashboard, Leaf, Users, ShieldAlert, Award, 
  FileSpreadsheet, Settings, LogOut, ChevronLeft, ChevronRight,
  TrendingUp, Activity, CheckSquare, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

const EcoLogo: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))' }}>
    <defs>
      <linearGradient id="logo-grad-sidebar" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="50%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" stroke="url(#logo-grad-sidebar)" strokeWidth="6" strokeDasharray="3 3" opacity="0.3" />
    <path d="M50 15C30.67 15 15 30.67 15 50C15 63.8 22.99 75.76 34.6 81.56C34.85 81.68 35.15 81.65 35.37 81.48C35.59 81.3 35.7 81.02 35.68 80.74C35.1 73.18 39.2 65.85 45.9 62.43C48.47 61.12 51.53 61.12 54.1 62.43C60.8 65.85 64.9 73.18 64.32 80.74C64.3 81.02 64.41 81.3 64.63 81.48C64.85 81.65 65.15 81.68 65.4 81.56C77.01 75.76 85 63.8 85 50C85 30.67 69.33 15 50 15Z" fill="url(#logo-grad-sidebar)" />
    <path d="M50 32C45.58 32 42 35.58 42 40C42 44.42 45.58 48 50 48C54.42 48 58 44.42 58 40C58 35.58 54.42 32 50 32Z" fill="#ffffff" />
  </svg>
);

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    {
      section: 'Environmental',
      items: [
        { name: 'Emission Factors', path: '/environmental/emission-factors', icon: Leaf },
        { name: 'Product ESG Profiles', path: '/environmental/product-profiles', icon: Leaf },
        { name: 'Carbon Transactions', path: '/environmental/carbon-transactions', icon: TrendingUp },
        { name: 'Goals', path: '/environmental/goals', icon: Activity },
      ]
    },
    {
      section: 'Social',
      items: [
        { name: 'CSR Activities', path: '/social/csr-activities', icon: Users },
        { name: 'Participations', path: '/social/participations', icon: CheckSquare },
        { name: 'Diversity Metrics', path: '/social/diversity', icon: Activity },
      ]
    },
    {
      section: 'Governance',
      items: [
        { name: 'Policies', path: '/governance/policies', icon: Shield },
        { name: 'Audits', path: '/governance/audits', icon: CheckSquare },
        { name: 'Compliance Issues', path: '/governance/compliance-issues', icon: ShieldAlert },
      ]
    },
    {
      section: 'Gamification',
      items: [
        { name: 'Challenges', path: '/gamification/challenges', icon: Award },
        { name: 'Badges', path: '/gamification/badges', icon: Award },
        { name: 'Rewards Catalog', path: '/gamification/rewards', icon: Award },
        { name: 'Leaderboard', path: '/gamification/leaderboard', icon: Award },
      ]
    },
    {
      section: 'Analysis',
      items: [
        { name: 'Report Builder', path: '/reports', icon: FileSpreadsheet },
        { name: 'Settings', path: '/settings', icon: Settings },
      ]
    }
  ];

  return (
    <aside 
      className="glass-panel" 
      style={{
        width: collapsed ? '80px' : '260px',
        transition: 'var(--transition-smooth)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        borderRadius: 0,
        borderRight: '1px solid var(--card-border)',
        borderLeft: 'none',
        borderTop: 'none',
        borderBottom: 'none',
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.65)'
      }}
    >
      {/* Sidebar Header */}
      <div style={{
        padding: '24px 20px',
        display: 'flex',
        flexDirection: collapsed ? 'column' : 'row',
        gap: collapsed ? '12px' : '0',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--card-border)'
      }}>
        {collapsed ? (
          <>
            <EcoLogo size={32} />
            <button 
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: 'var(--text-secondary)',
                borderRadius: '6px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronRight size={18} />
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <EcoLogo size={32} />
              <span style={{ fontWeight: 800, letterSpacing: '0.5px', fontSize: '1.2rem', color: '#fff' }}>
                EcoSphere
              </span>
            </div>
            <button 
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: 'var(--text-secondary)',
                borderRadius: '6px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronLeft size={18} />
            </button>
          </>
        )}
      </div>

      {/* Navigation Items */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '20px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {menuItems.map((item, idx) => {
          if ('section' in item) {
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {!collapsed && (
                  <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    paddingLeft: '12px',
                    marginBottom: '4px'
                  }}>
                    {item.section}
                  </span>
                )}
                {item.items && item.items.map((subItem) => {
                  const Icon = subItem.icon;
                  return (
                    <NavLink
                      key={subItem.path}
                      to={subItem.path}
                      onClick={() => {
                        if (location.pathname === subItem.path) {
                          clearCache();
                          window.location.reload();
                        }
                      }}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                        borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
                        transition: 'var(--transition-smooth)',
                        fontWeight: isActive ? 600 : 400
                      })}
                    >
                      <Icon size={18} />
                      {!collapsed && <span style={{ fontSize: '0.9rem' }}>{subItem.name}</span>}
                    </NavLink>
                  );
                })}
              </div>
            );
          } else {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (location.pathname === item.path) {
                    clearCache();
                    window.location.reload();
                  }
                }}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
                  transition: 'var(--transition-smooth)',
                  fontWeight: isActive ? 600 : 400,
                  marginBottom: '10px'
                })}
              >
                <Icon size={18} />
                {!collapsed && <span style={{ fontSize: '0.9rem' }}>{item.name}</span>}
              </NavLink>
            );
          }
        })}
      </div>

      {/* Sidebar Footer / User Profile */}
      <div style={{
        padding: '20px 12px',
        borderTop: '1px solid var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {!collapsed && profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: 'var(--primary-color)'
            }}>
              {profile.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.full_name}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {profile.role}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={signOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '12px',
            padding: '10px 12px',
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: '#f87171',
            transition: 'var(--transition-smooth)',
            fontSize: '0.9rem'
          }}
        >
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
