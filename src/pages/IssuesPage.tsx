import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Database,
  Settings,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useServer } from '../contexts/ServerContext';
import { api } from '../lib/api';
import { StatCard, Skeleton, EmptyState, Badge } from '../components/ui';

interface Issue {
  severity: 'Critical' | 'Warning' | 'Info';
  title: string;
  description: string;
  recommendation: string;
  current?: string;
  recommended?: string;
}

export default function IssuesPage() {
  const { currentServer, serverId } = useServer();
  const [configIssues, setConfigIssues] = useState<Issue[]>([]);
  const [perfIssues, setPerfIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  const fetchIssues = async (showRefreshing = false) => {
    if (!serverId) return;

    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      // Fetch both analyses in parallel
      const [configAnalysis, perfAnalysis] = await Promise.all([
        api.analyzeConfiguration(serverId),
        api.detectPerformanceIssues(serverId),
      ]);

      const configIssuesList = configAnalysis.map((issue) => ({
        severity: issue.severity,
        title: `Configuration: ${issue.parameter}`,
        description: issue.reason,
        recommendation: `Change from ${issue.current_value} to ${issue.recommended_value}`,
        current: issue.current_value,
        recommended: issue.recommended_value,
      }));

      const perfIssuesList = perfAnalysis.map((issue) => ({
        severity: issue.severity,
        title: issue.issue_type,
        description: issue.description,
        recommendation: issue.recommendation,
      }));

      setConfigIssues(configIssuesList);
      setPerfIssues(perfIssuesList);
      setLoading(false);
      setRefreshing(false);
    } catch (err: any) {
      setError(err.toString());
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!serverId) {
      setLoading(false);
      return;
    }
    fetchIssues();
  }, [serverId]);

  const toggleIssue = (id: string) => {
    setExpandedIssues(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!currentServer) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={Database}
          title="No Server Selected"
          description="Select a server from the Servers page to view issues"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} variant="stat-card" />
          ))}
        </div>
        <Skeleton variant="card" count={3} />
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
              <h3 className="font-semibold text-[var(--text-primary)]">Error analyzing server</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const allIssues = [...configIssues, ...perfIssues];
  const criticalCount = allIssues.filter(i => i.severity === 'Critical').length;
  const warningCount = allIssues.filter(i => i.severity === 'Warning').length;
  const infoCount = allIssues.filter(i => i.severity === 'Info').length;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return <AlertCircle className="w-5 h-5" />;
      case 'Warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return {
          bg: 'bg-[var(--error-muted)]',
          border: 'border-l-4 border-[var(--error)]',
          icon: 'text-[var(--error)]',
          badge: 'error' as const,
        };
      case 'Warning':
        return {
          bg: 'bg-[var(--warning-muted)]',
          border: 'border-l-4 border-[var(--warning)]',
          icon: 'text-[var(--warning)]',
          badge: 'warning' as const,
        };
      default:
        return {
          bg: 'bg-[var(--info-muted)]',
          border: 'border-l-4 border-[var(--info)]',
          icon: 'text-[var(--info)]',
          badge: 'info' as const,
        };
    }
  };

  const renderIssueCard = (issue: Issue, idx: number, type: 'config' | 'perf') => {
    const id = `${type}-${idx}`;
    const styles = getSeverityStyles(issue.severity);
    const isExpanded = expandedIssues.has(id);

    return (
      <div
        key={id}
        className={`${styles.bg} ${styles.border} rounded-xl overflow-hidden transition-all duration-200`}
      >
        <button
          onClick={() => toggleIssue(id)}
          className="w-full p-4 flex items-start gap-4 text-left hover:bg-black/5 transition-colors"
        >
          <div className={styles.icon}>
            {getSeverityIcon(issue.severity)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-semibold text-[var(--text-primary)]">
                {issue.title}
              </h4>
              <Badge variant={styles.badge}>
                {issue.severity}
              </Badge>
            </div>
            <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
              {issue.description}
            </p>
          </div>
          <div className="text-[var(--text-tertiary)]">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {isExpanded && (
          <div className="pr-4 pb-4 pl-14 space-y-3 animate-fade-in">
            {issue.current && issue.recommended && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--bg-surface)] rounded-lg p-3 border border-[var(--border-subtle)]">
                  <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Current</p>
                  <code className="text-sm font-mono text-[var(--error)]">{issue.current}</code>
                </div>
                <div className="bg-[var(--bg-surface)] rounded-lg p-3 border border-[var(--border-subtle)]">
                  <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Recommended</p>
                  <code className="text-sm font-mono text-[var(--success)]">{issue.recommended}</code>
                </div>
              </div>
            )}
            <div className="bg-[var(--bg-surface)] rounded-lg p-3 border border-[var(--border-subtle)]">
              <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Recommendation</p>
              <p className="text-sm text-[var(--text-secondary)]">{issue.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-tertiary)]">
            {currentServer.host}:{currentServer.port}
          </p>
        </div>
        <button
          onClick={() => fetchIssues(true)}
          disabled={refreshing}
          className="btn btn-secondary"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Critical Issues"
          value={criticalCount}
          icon={AlertCircle}
          variant="error"
          subtitle={criticalCount === 0 ? 'All clear' : 'Needs attention'}
        />
        <StatCard
          title="Warnings"
          value={warningCount}
          icon={AlertTriangle}
          variant="warning"
          subtitle={warningCount === 0 ? 'No warnings' : 'Review recommended'}
        />
        <StatCard
          title="Suggestions"
          value={infoCount}
          icon={Info}
          variant="info"
          subtitle="Optimization tips"
        />
      </div>

      {/* All Good State */}
      {allIssues.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--success-muted)] flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[var(--success)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            All Good!
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            No issues detected. Your PostgreSQL configuration looks healthy and optimized.
          </p>
        </div>
      )}

      {/* Configuration Issues */}
      {configIssues.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[var(--text-tertiary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Configuration Issues
            </h2>
            <Badge variant="default">{configIssues.length}</Badge>
          </div>
          <div className="space-y-3">
            {configIssues.map((issue, idx) => renderIssueCard(issue, idx, 'config'))}
          </div>
        </div>
      )}

      {/* Performance Issues */}
      {perfIssues.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[var(--text-tertiary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Performance Issues
            </h2>
            <Badge variant="default">{perfIssues.length}</Badge>
          </div>
          <div className="space-y-3">
            {perfIssues.map((issue, idx) => renderIssueCard(issue, idx, 'perf'))}
          </div>
        </div>
      )}
    </div>
  );
}
