import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = () => {
    let bg = 'rgba(148, 163, 184, 0.1)';
    let color = 'var(--text-secondary)';
    let border = '1px solid rgba(148, 163, 184, 0.15)';

    const s = status.toLowerCase();

    if (s === 'active' || s === 'approved' || s === 'completed' || s === 'resolved') {
      bg = 'rgba(52, 211, 153, 0.1)';
      color = 'var(--success)';
      border = '1px solid rgba(52, 211, 153, 0.2)';
    } else if (s === 'pending' || s === 'draft' || s === 'planned' || s === 'in progress') {
      bg = 'rgba(251, 191, 36, 0.1)';
      color = 'var(--warning)';
      border = '1px solid rgba(251, 191, 36, 0.2)';
    } else if (s === 'rejected' || s === 'inactive' || s === 'overdue' || s === 'critical') {
      bg = 'rgba(248, 113, 113, 0.1)';
      color = 'var(--danger)';
      border = '1px solid rgba(248, 113, 113, 0.2)';
    } else if (s === 'under review') {
      bg = 'rgba(56, 189, 248, 0.1)';
      color = 'var(--info)';
      border = '1px solid rgba(56, 189, 248, 0.2)';
    }

    return {
      background: bg,
      color,
      border,
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 'fit-content'
    };
  };

  return (
    <span style={getBadgeStyle()}>
      {status}
    </span>
  );
};
