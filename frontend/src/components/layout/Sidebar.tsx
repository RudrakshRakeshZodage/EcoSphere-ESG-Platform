import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Leaf, Users, ShieldAlert, Award, 
  FileSpreadsheet, Settings, LogOut, ChevronLeft, ChevronRight,
  TrendingUp, Activity, CheckSquare, Shield, HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { profile, signOut } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    {
      section: 'Environmental',
      items: [
        { name: 'Emission Factors', path: '/environmental/emission-factors', icon: Leaf },
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
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--card-border)'
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: '#fff',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
            }}>
              ES
            </div>
            <span style={{ fontWeight: 800, letterSpacing: '0.5px', fontSize: '1.2rem', color: '#fff' }}>
              EcoSphere
            </span>
          </div>
        )}
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
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
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
                {item.items.map((subItem) => {
                  const Icon = subItem.icon;
                  return (
                    <NavLink
                      key={subItem.path}
                      to={subItem.path}
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
