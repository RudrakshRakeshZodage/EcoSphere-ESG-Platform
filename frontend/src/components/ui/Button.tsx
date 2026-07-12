import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  style,
  ...props
}) => {
  const getStyles = () => {
    let bg = 'var(--primary-color)';
    let border = '1px solid transparent';
    let color = '#fff';

    if (variant === 'secondary') {
      bg = 'rgba(255, 255, 255, 0.05)';
      border = '1px solid var(--card-border)';
      color = 'var(--text-primary)';
    } else if (variant === 'danger') {
      bg = 'rgba(248, 113, 113, 0.1)';
      border = '1px solid rgba(248, 113, 113, 0.2)';
      color = '#f87171';
    } else if (variant === 'ghost') {
      bg = 'transparent';
      border = '1px solid transparent';
      color = 'var(--text-secondary)';
    }

    let padding = '10px 20px';
    let fontSize = '0.9rem';

    if (size === 'sm') {
      padding = '6px 12px';
      fontSize = '0.8rem';
    } else if (size === 'lg') {
      padding = '12px 28px';
      fontSize = '1rem';
    }

    return {
      background: bg,
      border,
      color,
      padding,
      fontSize,
      borderRadius: '8px',
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'var(--transition-smooth)',
      ...style
    };
  };

  return (
    <button style={getStyles()} {...props}>
      {children}
    </button>
  );
};
