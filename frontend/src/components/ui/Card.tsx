import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string | React.ReactNode;
  subtitle?: string;
  headerAction?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  style,
  className = ''
}) => {
  return (
    <div 
      className={`glass-panel ${className}`} 
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        ...style
      }}
    >
      {(title || subtitle || headerAction) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          paddingBottom: '15px',
          marginBottom: '5px'
        }}>
          <div>
            {title && (
              typeof title === 'string' ? (
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                  {title}
                </h3>
              ) : title
            )}
            {subtitle && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
};
