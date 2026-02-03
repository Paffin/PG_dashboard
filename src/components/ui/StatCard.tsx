import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
  };
  className?: string;
}

const variantStyles = {
  default: {
    iconBg: 'bg-[var(--bg-overlay)]',
    iconColor: 'text-[var(--text-secondary)]',
  },
  primary: {
    iconBg: 'bg-[var(--primary-muted)]',
    iconColor: 'text-[var(--primary)]',
  },
  success: {
    iconBg: 'bg-[var(--success-muted)]',
    iconColor: 'text-[var(--success)]',
  },
  warning: {
    iconBg: 'bg-[var(--warning-muted)]',
    iconColor: 'text-[var(--warning)]',
  },
  error: {
    iconBg: 'bg-[var(--error-muted)]',
    iconColor: 'text-[var(--error)]',
  },
  info: {
    iconBg: 'bg-[var(--info-muted)]',
    iconColor: 'text-[var(--info)]',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = 'primary',
  subtitle,
  trend,
  className = '',
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={`card p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[var(--text-tertiary)] mb-1">
            {title}
          </p>
          <p className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-[13px] text-[var(--text-tertiary)] mt-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${
              trend.direction === 'up' ? 'text-[var(--success)]' :
              trend.direction === 'down' ? 'text-[var(--error)]' :
              'text-[var(--text-tertiary)]'
            }`}>
              {trend.direction === 'up' && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l5-5 5 5M7 7l5 5 5-5" />
                </svg>
              )}
              {trend.direction === 'down' && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-5 5-5-5m10 10l-5-5-5 5" />
                </svg>
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${styles.iconBg}`}>
          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
        </div>
      </div>
    </div>
  );
}
