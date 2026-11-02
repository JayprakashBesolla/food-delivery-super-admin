import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--brand-primary, #ff5200)',
          color: '#ffffff',
          boxShadow: '0 1px 2px 0 rgba(255, 82, 0, 0.25)',
        };
      case 'secondary':
        return {
          backgroundColor: '#0f172a',
          color: '#ffffff',
          boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.1)',
        };
      case 'outline':
        return {
          backgroundColor: '#ffffff',
          color: '#1e293b',
          border: '1px solid #cbd5e1',
          boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: '#475569',
        };
      case 'danger':
        return {
          backgroundColor: '#ef4444',
          color: '#ffffff',
          boxShadow: '0 1px 2px 0 rgba(239, 68, 68, 0.2)',
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return { padding: '6px 12px', fontSize: '0.8125rem', gap: '6px', borderRadius: '6px' };
      case 'md':
        return { padding: '8px 14px', fontSize: '0.875rem', gap: '8px', borderRadius: '8px' };
      case 'lg':
        return { padding: '10px 18px', fontSize: '0.9375rem', gap: '8px', borderRadius: '10px' };
    }
  };

  const leading = leftIcon || icon;

  return (
    <button
      suppressHydrationWarning
      disabled={disabled || isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        border: 'none',
        ...getSizeStyles(),
        ...getVariantStyles(),
        ...style,
      }}
      {...props}
    >
      {isLoading ? (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid rgba(255,255,255,0.35)',
            borderTopColor: variant === 'outline' || variant === 'ghost' ? '#ff5200' : '#ffffff',
            borderRadius: '50%',
            animation: 'spin 0.75s linear infinite',
            display: 'inline-block',
          }}
        />
      ) : (
        leading && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{leading}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{rightIcon}</span>
      )}
    </button>
  );
};
