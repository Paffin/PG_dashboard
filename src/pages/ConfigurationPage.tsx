import { useEffect, useState, useMemo } from 'react';
import {
  Settings,
  Database,
  Cpu,
  HardDrive,
  Server,
  Search,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  ChevronsUpDown,
} from 'lucide-react';
import { useServer } from '../contexts/ServerContext';
import { api } from '../lib/api';
import { StatCard, Badge, Skeleton, EmptyState } from '../components/ui';
import type { PostgresConfig, HardwareInfo } from '../types';

export default function ConfigurationPage() {
  const { currentServer, serverId } = useServer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [settings, setSettings] = useState<PostgresConfig[]>([]);
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);

  useEffect(() => {
    if (!serverId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setError(null);
        const [settingsData, hwInfo] = await Promise.all([
          api.getAllSettings(serverId),
          api.getHardwareInfo(serverId),
        ]);

        setSettings(settingsData);
        setHardwareInfo(hwInfo);

        // Expand first 3 categories by default
        const categories = [...new Set(settingsData.map((s: PostgresConfig) => s.category))];
        setExpandedCategories(new Set(categories.slice(0, 3)));

        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    };

    fetchData();
  }, [serverId]);

  const groupedSettings = useMemo(() => {
    const filtered = settings.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.short_desc && s.short_desc.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const groups: Record<string, PostgresConfig[]> = {};
    filtered.forEach(setting => {
      if (!groups[setting.category]) {
        groups[setting.category] = [];
      }
      groups[setting.category].push(setting);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [settings, searchTerm]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(groupedSettings.map(([cat]) => cat)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  if (!currentServer) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={Database}
          title="No Server Selected"
          description="Select a server from the Servers page to view configuration"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="card p-5 border-l-4 border-[var(--error)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--error)] mt-0.5" />
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">Error loading configuration</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} variant="stat-card" />
          ))}
        </div>
        <Skeleton variant="card" count={3} />
      </div>
    );
  }

  const formatMemory = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  const nonDefaultCount = settings.filter(s => s.source !== 'default').length;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-sm text-[var(--text-tertiary)]">
          {currentServer.host}:{currentServer.port}
        </p>
      </div>

      {/* Hardware Info */}
      {hardwareInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="PostgreSQL Version"
            value={hardwareInfo.postgres_version.split(' ')[0]}
            icon={Database}
            variant="primary"
            subtitle={hardwareInfo.postgres_version.includes('(')
              ? hardwareInfo.postgres_version.match(/\(([^)]+)\)/)?.[1]
              : undefined}
          />
          <StatCard
            title="CPU Cores"
            value={hardwareInfo.cpu_cores}
            icon={Cpu}
            variant="info"
            subtitle="Detected cores"
          />
          <StatCard
            title="Total Memory"
            value={formatMemory(hardwareInfo.total_memory_mb)}
            icon={HardDrive}
            variant="success"
            subtitle="Estimated from config"
          />
          <StatCard
            title="OS Type"
            value={hardwareInfo.os_type}
            icon={Server}
            variant="warning"
          />
        </div>
      )}

      {/* Settings Section */}
      <div className="card overflow-hidden">
        {/* Search and Actions */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search settings..."
              className="input input-with-icon"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={expandAll} className="btn btn-ghost btn-sm">
              <ChevronsUpDown className="w-4 h-4" />
              Expand All
            </button>
            <button onClick={collapseAll} className="btn btn-ghost btn-sm">
              Collapse All
            </button>
          </div>
        </div>

        {/* Settings List */}
        <div className="divide-y divide-[var(--border-subtle)]">
          {groupedSettings.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-tertiary)]">
              No settings found matching "{searchTerm}"
            </div>
          ) : (
            groupedSettings.map(([category, categorySettings]) => (
              <div key={category}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-4 py-3 flex items-center justify-between
                    bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)]
                    transition-colors duration-150"
                >
                  <div className="flex items-center gap-3">
                    {expandedCategories.has(category) ? (
                      <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                    )}
                    <Settings className="w-4 h-4 text-[var(--primary)]" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {category}
                    </span>
                  </div>
                  <Badge variant="default">
                    {categorySettings.length}
                  </Badge>
                </button>

                {/* Settings in Category */}
                {expandedCategories.has(category) && (
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {categorySettings.map((setting) => (
                      <div
                        key={setting.name}
                        className="px-4 py-3 pl-12 hover:bg-[var(--bg-elevated)] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="text-sm font-semibold text-[var(--text-primary)]">
                                {setting.name}
                              </code>
                              {setting.source !== 'default' && (
                                <Badge variant="info" size="sm">
                                  {setting.source}
                                </Badge>
                              )}
                            </div>
                            {setting.short_desc && (
                              <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                                {setting.short_desc}
                              </p>
                            )}
                            {(setting.min_val || setting.max_val) && (
                              <p className="text-xs text-[var(--text-muted)] mt-1">
                                Range: {setting.min_val ?? '-'} to {setting.max_val ?? '-'}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <code className={`
                              text-sm font-mono px-2 py-1 rounded
                              ${setting.source !== 'default'
                                ? 'bg-[var(--primary-muted)] text-[var(--primary)]'
                                : 'bg-[var(--bg-overlay)] text-[var(--text-secondary)]'
                              }
                            `}>
                              {setting.setting}
                              {setting.unit && (
                                <span className="text-[var(--text-muted)] ml-1">{setting.unit}</span>
                              )}
                            </code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Stats */}
        <div className="px-4 py-3 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <span>
              {settings.length} total settings in {groupedSettings.length} categories
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span>
              {nonDefaultCount} non-default values
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
