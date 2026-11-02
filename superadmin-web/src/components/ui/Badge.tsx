import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  withDot?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  withDot = false,
  className = '',
  style: propStyle,
}) => {
  const showDot = dot || withDot;

  const styles: Record<BadgeVariant, { bg: string; text: string; border: string; dotColor: string }> = {
    brand: {
      bg: '#fff7ed',
      text: '#c2410c',
      border: '#fed7aa',
      dotColor: '#ea580c',
    },
    success: {
      bg: '#ecfdf5',
      text: '#065f46',
      border: '#a7f3d0',
      dotColor: '#10b981',
    },
    warning: {
      bg: '#fffbeb',
      text: '#92400e',
      border: '#fde68a',
      dotColor: '#f59e0b',
    },
    danger: {
      bg: '#fef2f2',
      text: '#991b1b',
      border: '#fecaca',
      dotColor: '#ef4444',
    },
    info: {
      bg: '#eff6ff',
      text: '#1e40af',
      border: '#bfdbfe',
      dotColor: '#3b82f6',
    },
    neutral: {
      bg: '#f8fafc',
      text: '#475569',
      border: '#e2e8f0',
      dotColor: '#94a3b8',
    },
  };

  const currentStyle = styles[variant];
  const sizeStyles = {
    sm: { padding: '1.5px 7px', fontSize: '0.6875rem', gap: '4px' },
    md: { padding: '3px 9px', fontSize: '0.75rem', gap: '5px' },
  }[size];

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: 600,
        borderRadius: '9999px',
        backgroundColor: currentStyle.bg,
        color: currentStyle.text,
        border: `1px solid ${currentStyle.border}`,
        lineHeight: 1.25,
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
        ...sizeStyles,
        ...propStyle,
      }}
    >
      {showDot && (
        <span
          style={{
            width: size === 'sm' ? '5px' : '6px',
            height: size === 'sm' ? '5px' : '6px',
            borderRadius: '50%',
            backgroundColor: currentStyle.dotColor,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
};
