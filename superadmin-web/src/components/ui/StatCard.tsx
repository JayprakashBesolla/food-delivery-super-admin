import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardTrend {
  value?: number | string;
  label?: string;
  isPositive?: boolean;
}

export interface StatCardChange {
  value: string;
  isPositive?: boolean;
  period?: string;
}

export interface StatCardProps {
  label?: string;
  title?: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  trend?: StatCardTrend;
  change?: StatCardChange;
  icon?: LucideIcon | React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }> | React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  highlightBorder?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  title,
  value,
  subtitle,
  badge,
  trend,
  change,
  icon,
  iconBgColor,
  iconColor = 'var(--brand-primary, #ff5200)',
  highlightBorder = false,
}) => {
  const displayTitle = title || label || '';
  const bgColor = iconBgColor || 'rgba(255, 82, 0, 0.08)';

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as React.ElementType;
    return <IconComponent size={20} color={iconColor} />;
  };

  return (
    <div
      className="admin-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '14px',
        padding: '20px',
        borderLeft: highlightBorder ? '3px solid var(--brand-primary)' : '1px solid var(--border-light)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'block',
            }}
          >
            {displayTitle}
          </span>
          <div
            className="tabular-nums"
            style={{
              fontSize: '1.625rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              marginTop: '4px',
              lineHeight: 1.2,
            }}
          >
            {value}
          </div>
        </div>

        {icon && (
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {renderIcon()}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          fontSize: '12px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ color: 'var(--text-secondary)' }}>
          {change && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 700,
                color: change.isPositive ? 'var(--success-text)' : 'var(--danger-text)',
              }}
            >
              {change.isPositive ? '↑' : '↓'} {change.value}
              {change.period && (
                <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> vs {change.period}</span>
              )}
            </span>
          )}
          {trend && (
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
              {trend.label}
            </span>
          )}
          {subtitle && !change && !trend && (
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{subtitle}</span>
          )}
        </div>

        {badge && (
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '9999px',
              backgroundColor: 'var(--bg-surface-muted)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-light)',
            }}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
