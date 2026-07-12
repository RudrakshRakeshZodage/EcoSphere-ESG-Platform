import React from 'react';
import { Card } from './Card';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection = 'neutral',
  color = 'var(--primary-color)'
}) => {
  return (
    <Card style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {title}
          </span>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            {value}
          </span>
        </div>
        <div style={{
          background: `rgba(255,255,255,0.03)`,
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}>
          <Icon size={20} />
        </div>
      </div>
      {trend && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '15px',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: trendDirection === 'up' ? 'var(--success)' : trendDirection === 'down' ? 'var(--danger)' : 'var(--text-muted)'
        }}>
          <span>{trend}</span>
        </div>
      )}
    </Card>
  );
};
