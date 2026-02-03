import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
}

const sizeStyles = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
}: BadgeProps) {
  const sizeClasses = sizeStyles[size];

  return (
    <span className={`badge badge-${variant} ${sizeClasses}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' ? 'bg-[var(--success)]' :
          variant === 'warning' ? 'bg-[var(--warning)]' :
          variant === 'error' ? 'bg-[var(--error)]' :
          variant === 'info' ? 'bg-[var(--info)]' :
          variant === 'primary' ? 'bg-[var(--primary)]' :
          'bg-[var(--text-tertiary)]'
        }`} />
      )}
      {children}
    </span>
  );
}
