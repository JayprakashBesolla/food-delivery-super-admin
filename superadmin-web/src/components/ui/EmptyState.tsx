import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) return <Inbox size={compact ? 20 : 24} />;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as React.ElementType;
    return <IconComponent size={compact ? 20 : 24} />;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? '24px 16px' : '44px 20px',
        backgroundColor: 'var(--bg-surface-subtle)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-strong)',
      }}
    >
      <div
        style={{
          width: compact ? '40px' : '48px',
          height: compact ? '40px' : '48px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-surface-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          marginBottom: '12px',
          border: '1px solid var(--border-light)',
        }}
      >
        {renderIcon()}
      </div>

      <h4
        style={{
          fontSize: compact ? '14px' : '15px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: 0,
        }}
      >
        {title}
      </h4>

      <p
        style={{
          fontSize: '12.5px',
          color: 'var(--text-secondary)',
          maxWidth: '380px',
          marginTop: '4px',
          marginBottom: action ? '16px' : 0,
          lineHeight: 1.45,
        }}
      >
        {description}
      </p>

      {action && <div>{action}</div>}
    </div>
  );
}
