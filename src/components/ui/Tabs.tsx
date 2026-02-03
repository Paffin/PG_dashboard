import { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills';
}

export function Tabs({ tabs, activeTab, onChange, variant = 'default' }: TabsProps) {
  if (variant === 'pills') {
    return (
      <div className="flex gap-2 p-1 bg-[var(--bg-elevated)] rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${isActive
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }
              `}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`
                  px-1.5 py-0.5 rounded text-xs font-medium
                  ${isActive
                    ? 'bg-[var(--primary-muted)] text-[var(--primary)]'
                    : 'bg-[var(--bg-overlay)] text-[var(--text-tertiary)]'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="border-b border-[var(--border-subtle)]">
      <nav className="flex gap-1 px-2" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-3 text-sm font-medium
                transition-all duration-200
                ${isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }
              `}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`
                  px-1.5 py-0.5 rounded text-xs font-medium
                  ${isActive
                    ? 'bg-[var(--primary-muted)] text-[var(--primary)]'
                    : 'bg-[var(--bg-overlay)] text-[var(--text-tertiary)]'
                  }
                `}>
                  {tab.count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--primary)] rounded-t-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
