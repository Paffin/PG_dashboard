interface SkeletonProps {
  variant?: 'text' | 'card' | 'table-row' | 'stat-card' | 'circle';
  count?: number;
  className?: string;
}

function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function Skeleton({ variant = 'text', count = 1, className = '' }: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'text') {
    return (
      <div className={`space-y-3 ${className}`}>
        {items.map((i) => (
          <SkeletonLine key={i} className="h-4 w-full" />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return <SkeletonLine className={`rounded-full ${className}`} />;
  }

  if (variant === 'stat-card') {
    return (
      <div className={`card p-5 ${className}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <SkeletonLine className="h-3 w-24" />
            <SkeletonLine className="h-7 w-16" />
          </div>
          <SkeletonLine className="h-11 w-11 rounded-xl" />
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`card p-5 space-y-4 ${className}`}>
        {items.map((i) => (
          <div key={i} className="space-y-2">
            <SkeletonLine className="h-4 w-1/3" />
            <SkeletonLine className="h-4 w-full" />
            <SkeletonLine className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className={`divide-y divide-[var(--border-subtle)] ${className}`}>
        {items.map((i) => (
          <div key={i} className="flex gap-4 items-center py-4 px-4">
            <SkeletonLine className="h-4 w-16" />
            <SkeletonLine className="h-4 w-24" />
            <SkeletonLine className="h-4 flex-1" />
            <SkeletonLine className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return null;
}
