import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Activity,
  Database,
  Table2,
  Lock,
  HardDrive,
  RefreshCw,
  Search,
  AlertCircle,
  Pause,
  Play,
  FileSearch,
  Loader2,
} from 'lucide-react';
import { useServer } from '../contexts/ServerContext';
import { api } from '../lib/api';
import { Tabs, Badge, DataTable, StatCard, Skeleton, EmptyState } from '../components/ui';
import ExplainPlanModal from '../components/ExplainPlanModal';
import type { ActiveQuery, TableStats, IndexStats, LockInfo, BgWriterStats, ExplainPlan } from '../types';

type TabId = 'queries' | 'tables' | 'indexes' | 'locks' | 'bgwriter';

export default function MetricsPage() {
  const { currentServer, serverId } = useServer();
  const [activeTab, setActiveTab] = useState<TabId>('queries');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Data states
  const [activeQueries, setActiveQueries] = useState<ActiveQuery[]>([]);
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [indexStats, setIndexStats] = useState<IndexStats[]>([]);
  const [locks, setLocks] = useState<LockInfo[]>([]);
  const [bgWriterStats, setBgWriterStats] = useState<BgWriterStats | null>(null);

  // Explain plan state
  const [explainPlan, setExplainPlan] = useState<ExplainPlan | null>(null);
  const [explainLoading, setExplainLoading] = useState<number | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const tabs = [
    { id: 'queries', label: 'Active Queries', icon: Activity, count: activeQueries.length },
    { id: 'tables', label: 'Tables', icon: Table2, count: tableStats.length },
    { id: 'indexes', label: 'Indexes', icon: Database, count: indexStats.length },
    { id: 'locks', label: 'Locks', icon: Lock, count: locks.length },
    { id: 'bgwriter', label: 'Background Writer', icon: HardDrive },
  ];

  const fetchData = useCallback(async () => {
    if (!serverId) return;

    try {
      setError(null);
      const [queries, tables, indexes, locksData, bgwriter] = await Promise.all([
        api.getActiveQueries(serverId),
        api.getTableStats(serverId, 50),
        api.getIndexStats(serverId, 50),
        api.getLocks(serverId),
        api.getBgwriterStats(serverId),
      ]);

      if (mountedRef.current) {
        setActiveQueries(queries);
        setTableStats(tables);
        setIndexStats(indexes);
        setLocks(locksData);
        setBgWriterStats(bgwriter);
        setLoading(false);
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    }
  }, [serverId]);

  // Schedule next fetch using setTimeout (not setInterval) to prevent request accumulation
  const scheduleNextFetch = useCallback(() => {
    if (autoRefresh && mountedRef.current) {
      timeoutRef.current = window.setTimeout(async () => {
        await fetchData();
        scheduleNextFetch();
      }, 5000);
    }
  }, [autoRefresh, fetchData]);

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    if (!serverId) {
      setLoading(false);
      return;
    }

    mountedRef.current = true;

    fetchData().then(() => {
      scheduleNextFetch();
    });

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [serverId, fetchData, scheduleNextFetch]);

  // Handle autoRefresh toggle
  useEffect(() => {
    if (!autoRefresh && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    } else if (autoRefresh && !timeoutRef.current && serverId) {
      scheduleNextFetch();
    }
  }, [autoRefresh, scheduleNextFetch, serverId]);

  const handleExplain = async (query: ActiveQuery, analyze: boolean = false) => {
    if (!serverId) return;

    // Skip system queries and idle connections
    if (!query.query || query.state === 'idle' || query.query.startsWith('EXPLAIN')) {
      return;
    }

    setExplainLoading(query.pid);
    setExplainError(null);

    try {
      const plan = await api.explainQuery(serverId, query.query, analyze);
      setExplainPlan(plan);
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : String(err));
    } finally {
      setExplainLoading(null);
    }
  };

  if (!currentServer) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={Database}
          title="No Server Selected"
          description="Select a server from the Servers page to view metrics"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-[var(--bg-surface)] rounded-lg p-5 border-l-4 border-[var(--error)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--error)] mt-0.5" />
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">Error loading metrics</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredQueries = activeQueries.filter(q =>
    q.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.usename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTables = tableStats.filter(t =>
    t.relname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.schemaname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredIndexes = indexStats.filter(i =>
    i.indexname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.tablename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    if (loading) {
      return <Skeleton variant="table-row" count={5} />;
    }

    switch (activeTab) {
      case 'queries':
        return (
          <DataTable
            data={filteredQueries}
            emptyMessage="No active queries"
            rowKey={(row) => row.pid}
            exportable
            exportFilename="active_queries"
            columns={[
              { key: 'pid', header: 'PID', sortable: true, width: '80px' },
              { key: 'usename', header: 'User', sortable: true },
              { key: 'application_name', header: 'Application', sortable: true },
              {
                key: 'state',
                header: 'State',
                sortable: true,
                render: (value) => (
                  <Badge variant={
                    value === 'active' ? 'success' :
                    value === 'idle' ? 'default' :
                    value === 'idle in transaction' ? 'warning' : 'info'
                  }>
                    {String(value)}
                  </Badge>
                ),
              },
              {
                key: 'wait_event_type',
                header: 'Wait',
                render: (value, row) => value ? (
                  <span className="text-[var(--text-secondary)] text-xs">
                    {String(value)}: {row.wait_event}
                  </span>
                ) : '-',
              },
              {
                key: 'query',
                header: 'Query',
                maxWidth: '350px',
                render: (value) => (
                  <code className="font-mono text-xs text-[var(--text-secondary)] block truncate" title={String(value)}>
                    {String(value)}
                  </code>
                ),
              },
              {
                key: 'actions',
                header: 'Explain',
                width: '100px',
                render: (_value, row) => {
                  const canExplain = row.query && row.state !== 'idle' && !row.query.startsWith('EXPLAIN');
                  const isLoading = explainLoading === row.pid;

                  return canExplain ? (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExplain(row, false);
                        }}
                        disabled={isLoading}
                        className="btn btn-sm btn-ghost text-[var(--primary)] hover:bg-[var(--primary)]/10 px-2 py-1"
                        title="Show query execution plan"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileSearch className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-[var(--text-muted)] text-xs">-</span>
                  );
                },
              },
            ]}
          />
        );

      case 'tables':
        return (
          <DataTable
            data={filteredTables}
            emptyMessage="No table statistics"
            rowKey={(row) => `${row.schemaname}.${row.relname}`}
            exportable
            exportFilename="table_stats"
            columns={[
              { key: 'schemaname', header: 'Schema', sortable: true },
              { key: 'relname', header: 'Table', sortable: true },
              { key: 'seq_scan', header: 'Seq Scans', sortable: true, align: 'right' },
              { key: 'idx_scan', header: 'Idx Scans', sortable: true, align: 'right', render: (v) => String(v ?? 0) },
              { key: 'n_live_tup', header: 'Live Tuples', sortable: true, align: 'right', render: (v) => Number(v).toLocaleString() },
              {
                key: 'n_dead_tup',
                header: 'Dead Tuples',
                sortable: true,
                align: 'right',
                render: (value, row) => {
                  const dead = Number(value);
                  const live = Number(row.n_live_tup);
                  const ratio = live > 0 ? (dead / live) * 100 : 0;
                  return (
                    <span className={ratio > 10 ? 'text-[var(--error)] font-medium' : ''}>
                      {dead.toLocaleString()}
                      {ratio > 10 && <span className="ml-1 text-xs">({ratio.toFixed(1)}%)</span>}
                    </span>
                  );
                },
              },
              {
                key: 'last_autovacuum',
                header: 'Last Vacuum',
                render: (value) => value ? (
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {new Date(String(value)).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">Never</span>
                ),
              },
            ]}
          />
        );

      case 'indexes':
        return (
          <DataTable
            data={filteredIndexes}
            emptyMessage="No index statistics"
            rowKey={(row) => `${row.schemaname}.${row.indexname}`}
            exportable
            exportFilename="index_stats"
            columns={[
              { key: 'schemaname', header: 'Schema', sortable: true },
              { key: 'tablename', header: 'Table', sortable: true },
              { key: 'indexname', header: 'Index', sortable: true },
              {
                key: 'idx_scan',
                header: 'Scans',
                sortable: true,
                align: 'right',
                render: (value) => {
                  const scans = Number(value);
                  return (
                    <span className={scans === 0 ? 'text-[var(--warning)] font-medium' : ''}>
                      {scans.toLocaleString()}
                      {scans === 0 && <span className="ml-1 text-xs">(unused)</span>}
                    </span>
                  );
                },
              },
              { key: 'idx_tup_read', header: 'Tuples Read', sortable: true, align: 'right', render: (v) => Number(v).toLocaleString() },
              { key: 'idx_tup_fetch', header: 'Tuples Fetched', sortable: true, align: 'right', render: (v) => Number(v).toLocaleString() },
            ]}
          />
        );

      case 'locks':
        return (
          <DataTable
            data={locks}
            emptyMessage="No active locks"
            rowKey={(row) => `${row.pid}-${row.locktype}-${row.mode}`}
            exportable
            exportFilename="locks"
            columns={[
              { key: 'pid', header: 'PID', sortable: true, width: '80px' },
              { key: 'locktype', header: 'Type', sortable: true },
              { key: 'database', header: 'Database', sortable: true, render: (v) => String(v ?? '-') },
              { key: 'relation', header: 'Relation', sortable: true, render: (v) => String(v ?? '-') },
              { key: 'mode', header: 'Mode', sortable: true },
              {
                key: 'granted',
                header: 'Status',
                sortable: true,
                render: (value) => (
                  <Badge variant={value ? 'success' : 'warning'}>
                    {value ? 'Granted' : 'Waiting'}
                  </Badge>
                ),
              },
            ]}
          />
        );

      case 'bgwriter':
        if (!bgWriterStats) return <Skeleton variant="stat-card" count={4} />;

        const checkpointTotal = bgWriterStats.checkpoints_timed + bgWriterStats.checkpoints_req;
        const checkpointRatio = checkpointTotal > 0
          ? ((bgWriterStats.checkpoints_timed / checkpointTotal) * 100).toFixed(1)
          : '0';

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Timed Checkpoints"
                value={bgWriterStats.checkpoints_timed.toLocaleString()}
                icon={HardDrive}
                variant="info"
                subtitle={`${checkpointRatio}% of total`}
              />
              <StatCard
                title="Requested Checkpoints"
                value={bgWriterStats.checkpoints_req.toLocaleString()}
                icon={HardDrive}
                variant="warning"
              />
              <StatCard
                title="Buffers Written"
                value={bgWriterStats.buffers_checkpoint.toLocaleString()}
                icon={HardDrive}
                variant="primary"
                subtitle="By checkpoints"
              />
              <StatCard
                title="Buffers Allocated"
                value={bgWriterStats.buffers_alloc.toLocaleString()}
                icon={HardDrive}
                variant="info"
              />
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-5">
                Checkpoint Timing
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Write Time</p>
                  <p className="text-xl font-semibold text-[var(--text-primary)] tabular-nums">
                    {(bgWriterStats.checkpoint_write_time / 1000).toFixed(2)}s
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Sync Time</p>
                  <p className="text-xl font-semibold text-[var(--text-primary)] tabular-nums">
                    {(bgWriterStats.checkpoint_sync_time / 1000).toFixed(2)}s
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Buffers Clean</p>
                  <p className="text-xl font-semibold text-[var(--text-primary)] tabular-nums">
                    {bgWriterStats.buffers_clean.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Buffers Backend</p>
                  <p className="text-xl font-semibold text-[var(--text-primary)] tabular-nums">
                    {bgWriterStats.buffers_backend.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-[var(--text-tertiary)]">
            {currentServer.host}:{currentServer.port}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="input input-with-icon w-64"
            />
          </div>

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn ${autoRefresh ? 'btn-primary' : 'btn-secondary'}`}
          >
            {autoRefresh ? (
              <>
                <Pause className="w-4 h-4" />
                Live
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Paused
              </>
            )}
          </button>

          {/* Manual refresh */}
          {!autoRefresh && (
            <button
              onClick={fetchData}
              className="btn btn-secondary btn-icon"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="card">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />
        <div className="p-5">
          {renderContent()}
        </div>
      </div>

      {/* Explain Error Toast */}
      {explainError && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-4">
          <div className="bg-[var(--bg-surface)] rounded-lg p-4 border-l-4 border-[var(--error)] shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--error)] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-[var(--text-primary)] text-sm">Failed to explain query</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{explainError}</p>
              </div>
              <button
                onClick={() => setExplainError(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explain Plan Modal */}
      {explainPlan && (
        <ExplainPlanModal
          plan={explainPlan}
          onClose={() => setExplainPlan(null)}
        />
      )}
    </div>
  );
}
