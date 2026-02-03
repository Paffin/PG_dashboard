import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Activity,
  Database,
  HardDrive,
  Users,
  AlertCircle,
  TrendingUp,
  Clock,
  Pause,
  Play,
  Zap,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useServer } from '../contexts/ServerContext';
import { api } from '../lib/api';
import { StatCard, Skeleton, EmptyState, Badge } from '../components/ui';
import ExplainPlanModal from '../components/ExplainPlanModal';
import type { ExplainPlan } from '../types';

interface Stats {
  connections: number;
  tps: number;
  cacheHitRatio: number;
  databaseSize: string;
}

interface HistoryPoint {
  time: string;
  connections: number;
  cacheHit: number;
  tps: number;
}

export default function DashboardPage() {
  const { currentServer, serverId } = useServer();
  const [stats, setStats] = useState<Stats | null>(null);
  const [topQueries, setTopQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [explainPlan, setExplainPlan] = useState<ExplainPlan | null>(null);
  const [explainLoading, setExplainLoading] = useState<string | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const handleExplain = async (query: string) => {
    if (!serverId) return;
    setExplainLoading(query);
    setExplainError(null);
    try {
      const plan = await api.explainQuery(serverId, query, false);
      setExplainPlan(plan);
    } catch (err: any) {
      setExplainError(err.toString());
    } finally {
      setExplainLoading(null);
    }
  };

  const fetchData = useCallback(async () => {
    if (!serverId) return;

    try {
      setError(null);

      const dbStats = await api.getDatabaseStats(serverId);
      const sizes = await api.getDatabaseSizes(serverId);

      const totalConnections = dbStats.reduce((sum: number, db: any) => sum + db.numbackends, 0);
      const totalCommits = dbStats.reduce((sum: number, db: any) => sum + db.xact_commit, 0);
      const totalRollbacks = dbStats.reduce((sum: number, db: any) => sum + db.xact_rollback, 0);
      const totalBlksHit = dbStats.reduce((sum: number, db: any) => sum + db.blks_hit, 0);
      const totalBlksRead = dbStats.reduce((sum: number, db: any) => sum + db.blks_read, 0);

      const cacheHitRatio = totalBlksHit + totalBlksRead > 0
        ? (totalBlksHit / (totalBlksHit + totalBlksRead)) * 100
        : 0;

      const totalSize = sizes.length > 0 ? sizes[0].size_pretty : '0 B';

      if (mountedRef.current) {
        setStats({
          connections: totalConnections,
          tps: totalCommits + totalRollbacks,
          cacheHitRatio: parseFloat(cacheHitRatio.toFixed(2)),
          databaseSize: totalSize,
        });

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setHistory(prev => {
          const newHistory = [...prev, {
            time: timestamp,
            connections: totalConnections,
            cacheHit: parseFloat(cacheHitRatio.toFixed(2)),
            tps: totalCommits + totalRollbacks,
          }];
          return newHistory.slice(-20);
        });

        try {
          const queries = await api.getTopQueries(serverId, 5);
          setTopQueries(queries);
        } catch {
          console.log('pg_stat_statements not available');
        }

        setLoading(false);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.toString());
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

  if (!currentServer) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={Database}
          title="No Server Selected"
          description="Select a server from the Servers page to view the dashboard"
        />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
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
              <h3 className="font-semibold text-[var(--text-primary)]">Error loading dashboard</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg px-3 py-2 shadow-lg">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">{label}</p>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {payload[0].value}{payload[0].dataKey === 'cacheHit' ? '%' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-tertiary)] mb-1">
            {currentServer.host}:{currentServer.port} / {currentServer.database}
          </p>
        </div>
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Connections"
          value={stats?.connections || 0}
          icon={Users}
          variant="info"
        />
        <StatCard
          title="Total Transactions"
          value={(stats?.tps || 0).toLocaleString()}
          icon={Activity}
          variant="success"
        />
        <StatCard
          title="Cache Hit Ratio"
          value={`${stats?.cacheHitRatio || 0}%`}
          icon={HardDrive}
          variant={(stats?.cacheHitRatio || 0) >= 90 ? 'success' : 'warning'}
          subtitle={(stats?.cacheHitRatio || 0) >= 90 ? 'Healthy' : 'Needs attention'}
        />
        <StatCard
          title="Database Size"
          value={stats?.databaseSize || '0 B'}
          icon={Database}
          variant="primary"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Connection History */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-[var(--info)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Connection Activity</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorConnections" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--info)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--info)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-muted)' }}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-muted)' }}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="connections"
                stroke="var(--info)"
                strokeWidth={2}
                fill="url(#colorConnections)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cache Hit Ratio History */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <HardDrive className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Cache Hit Ratio</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorCache" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-muted)' }}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tick={{ fill: 'var(--text-muted)' }}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cacheHit"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#colorCache)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Queries */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--warning)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Top Queries by Execution Time
          </h3>
        </div>
        {topQueries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Query</th>
                  <th className="text-right">Calls</th>
                  <th className="text-right">Avg Time</th>
                  <th className="text-right">Total Time</th>
                  <th className="w-[80px]"></th>
                </tr>
              </thead>
              <tbody>
                {topQueries.slice(0, 5).map((query, idx) => (
                  <tr key={idx}>
                    <td className="max-w-md">
                      <code className="text-xs font-mono text-[var(--text-secondary)] block truncate" title={query.query}>
                        {query.query}
                      </code>
                    </td>
                    <td className="text-right font-medium tabular-nums">
                      {query.calls.toLocaleString()}
                    </td>
                    <td className="text-right">
                      <Badge variant={query.mean_exec_time > 100 ? 'warning' : 'default'}>
                        {query.mean_exec_time.toFixed(2)} ms
                      </Badge>
                    </td>
                    <td className="text-right font-medium tabular-nums">
                      {(query.total_exec_time / 1000).toFixed(2)} s
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleExplain(query.query)}
                        disabled={explainLoading === query.query}
                        className="btn btn-secondary btn-sm"
                        title="View execution plan"
                      >
                        {explainLoading === query.query ? (
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                        <span>Explain</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Database className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-tertiary)]">No query data available</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Enable pg_stat_statements extension for query statistics
            </p>
          </div>
        )}
      </div>

      {/* Explain error toast */}
      {explainError && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-4">
          <div className="bg-[var(--bg-surface)] rounded-lg p-4 border-l-4 border-[var(--error)] shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--error)] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-[var(--text-primary)]">EXPLAIN failed</h4>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{explainError}</p>
              </div>
              <button
                onClick={() => setExplainError(null)}
                className="p-1 hover:bg-[var(--bg-hover)] rounded"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
