import { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

type AlertVariant = 'error' | 'warning' | 'info' | 'success';

interface AlertCardProps {
  variant: AlertVariant;
  title: string;
  children: ReactNode;
  className?: string;
}

const config = {
  error: {
    icon: AlertCircle,
    borderColor: 'border-[var(--error)]',
    iconColor: 'text-[var(--error)]',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'border-[var(--warning)]',
    iconColor: 'text-[var(--warning)]',
  },
  info: {
    icon: Info,
    borderColor: 'border-[var(--info)]',
    iconColor: 'text-[var(--info)]',
  },
  success: {
    icon: CheckCircle,
    borderColor: 'border-[var(--success)]',
    iconColor: 'text-[var(--success)]',
  },
};

export function AlertCard({ variant, title, children, className = '' }: AlertCardProps) {
  const { icon: Icon, borderColor, iconColor } = config[variant];

  return (
    <div className={`bg-[var(--bg-surface)] rounded-lg p-5 border-l-4 ${borderColor} ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
          <div className="text-sm text-[var(--text-secondary)] mt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
