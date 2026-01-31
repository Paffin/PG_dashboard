import { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, Info, Database, Settings, Zap } from 'lucide-react';
import { useServer } from '../contexts/ServerContext';
import { api } from '../lib/api';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serverId) {
      setLoading(false);
      return;
    }

    const fetchIssues = async () => {
      try {
        setError(null);

        // Fetch configuration issues
        const configAnalysis = await api.analyzeConfiguration(serverId);
        const configIssuesList = configAnalysis.map((issue: any) => ({
          severity: issue.severity,
          title: `Configuration: ${issue.parameter}`,
          description: issue.reason,
          recommendation: `Change from ${issue.current_value} to ${issue.recommended_value}`,
          current: issue.current_value,
          recommended: issue.recommended_value,
        }));

        // Fetch performance issues
        const perfAnalysis = await api.detectPerformanceIssues(serverId);
        const perfIssuesList = perfAnalysis.map((issue: any) => ({
          severity: issue.severity,
          title: issue.issue_type,
          description: issue.description,
          recommendation: issue.recommendation,
        }));

        setConfigIssues(configIssuesList);
        setPerfIssues(perfIssuesList);
        setLoading(false);
      } catch (err: any) {
        setError(err.toString());
        setLoading(false);
      }
    };

    fetchIssues();
  }, [serverId]);

  if (!currentServer) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Server Selected
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Please select a server from the Servers page to view issues
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">Analyzing server...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">Error analyzing server</span>
          </div>
          <p className="text-red-700 dark:text-red-300 mt-2 text-sm">{error}</p>
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
        };
      case 'Warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-800 dark:text-yellow-200',
          badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-200',
          badge: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
        };
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Issues & Recommendations
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          {currentServer.name} - {currentServer.host}:{currentServer.port}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
              <p className="text-2xl font-bold text-red-800 dark:text-red-200">{criticalCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Warning</p>
              <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{warningCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Info className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Info</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{infoCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* No Issues */}
      {allIssues.length === 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
            All Good!
          </h3>
          <p className="text-green-700 dark:text-green-300">
            No issues detected. Your PostgreSQL configuration looks healthy.
          </p>
        </div>
      )}

      {/* Configuration Issues */}
      {configIssues.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Configuration Issues
          </h3>
          <div className="space-y-4">
            {configIssues.map((issue, idx) => {
              const colors = getSeverityColor(issue.severity);
              return (
                <div
                  key={idx}
                  className={`${colors.bg} ${colors.border} border rounded-lg p-6`}
                >
                  <div className="flex items-start gap-4">
                    <div className={colors.text}>
                      {getSeverityIcon(issue.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className={`font-semibold ${colors.text}`}>
                          {issue.title}
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${colors.badge}`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className={`text-sm mb-3 ${colors.text}`}>
                        {issue.description}
                      </p>
                      {issue.current && issue.recommended && (
                        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                          <div>
                            <span className="font-medium">Current:</span>{' '}
                            <span className="font-mono">{issue.current}</span>
                          </div>
                          <div>
                            <span className="font-medium">Recommended:</span>{' '}
                            <span className="font-mono">{issue.recommended}</span>
                          </div>
                        </div>
                      )}
                      <div className={`text-sm ${colors.text} bg-white dark:bg-gray-800 p-3 rounded`}>
                        <span className="font-medium">💡 Recommendation:</span> {issue.recommendation}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance Issues */}
      {perfIssues.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Performance Issues
          </h3>
          <div className="space-y-4">
            {perfIssues.map((issue, idx) => {
              const colors = getSeverityColor(issue.severity);
              return (
                <div
                  key={idx}
                  className={`${colors.bg} ${colors.border} border rounded-lg p-6`}
                >
                  <div className="flex items-start gap-4">
                    <div className={colors.text}>
                      {getSeverityIcon(issue.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className={`font-semibold ${colors.text}`}>
                          {issue.title}
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${colors.badge}`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className={`text-sm mb-3 ${colors.text}`}>
                        {issue.description}
                      </p>
                      <div className={`text-sm ${colors.text} bg-white dark:bg-gray-800 p-3 rounded`}>
                        <span className="font-medium">💡 Recommendation:</span> {issue.recommendation}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
