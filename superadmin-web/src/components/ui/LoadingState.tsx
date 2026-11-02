import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  label = 'Loading platform telemetry...',
  className = '',
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 16,
    md: 22,
    lg: 32,
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px',
        gap: '10px',
        color: 'var(--text-muted)',
      }}
    >
      <Loader2
        size={sizeMap[size]}
        style={{
          color: 'var(--brand-primary)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {label && (
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({
  width = '100%',
  height = '18px',
  borderRadius = 'var(--radius-sm)',
  style,
}: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--slate-200)',
        animation: 'pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        ...style,
      }}
    />
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '14px' }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="20px" width="65%" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '14px',
            padding: '10px 0',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} height="16px" width={c === 0 ? '85%' : '55%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div
      className="admin-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '14px',
        padding: '20px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="105px" height="14px" />
        <Skeleton width="36px" height="36px" borderRadius="var(--radius-md)" />
      </div>
      <Skeleton width="130px" height="28px" />
      <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
        <Skeleton width="90px" height="12px" />
      </div>
    </div>
  );
}
