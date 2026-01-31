import { useEffect, useState } from 'react';
import { Activity, Database, HardDrive, Users, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useServer } from '../contexts/ServerContext';
import { api } from '../lib/api';

interface Stats {
  connections: number;
  tps: number;
  cacheHitRatio: number;
  databaseSize: string;
}

export default function DashboardPage() {
  const { currentServer, serverId } = useServer();
  const [stats, setStats] = useState<Stats | null>(null);
  const [topQueries, setTopQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!serverId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setError(null);

        // Fetch database stats
        const dbStats = await api.getDatabaseStats(serverId);
        const sizes = await api.getDatabaseSizes(serverId);

        // Calculate stats
        const totalConnections = dbStats.reduce((sum, db) => sum + db.numbackends, 0);
        const totalCommits = dbStats.reduce((sum, db) => sum + db.xact_commit, 0);
        const totalRollbacks = dbStats.reduce((sum, db) => sum + db.xact_rollback, 0);
        const totalBlksHit = dbStats.reduce((sum, db) => sum + db.blks_hit, 0);
        const totalBlksRead = dbStats.reduce((sum, db) => sum + db.blks_read, 0);

        const cacheHitRatio = totalBlksHit + totalBlksRead > 0
          ? (totalBlksHit / (totalBlksHit + totalBlksRead)) * 100
          : 0;

        const totalSize = sizes.length > 0 ? sizes[0].size_pretty : '0 B';

        setStats({
          connections: totalConnections,
          tps: totalCommits + totalRollbacks,
          cacheHitRatio: parseFloat(cacheHitRatio.toFixed(2)),
          databaseSize: totalSize,
        });

        // Add to history for chart
        const timestamp = new Date().toLocaleTimeString();
        setHistory(prev => {
          const newHistory = [...prev, {
            time: timestamp,
            connections: totalConnections,
            cacheHit: parseFloat(cacheHitRatio.toFixed(2)),
          }];
          return newHistory.slice(-10); // Keep last 10 points
        });

        // Fetch top queries if pg_stat_statements is available
        try {
          const queries = await api.getTopQueries(serverId, 5);
          setTopQueries(queries);
        } catch (err) {
          // pg_stat_statements might not be installed
          console.log('pg_stat_statements not available');
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.toString());
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
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
            Please select a server from the Servers page to view metrics
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">Loading metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">Error loading metrics</span>
          </div>
          <p className="text-red-700 dark:text-red-300 mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Active Connections',
      value: stats?.connections || 0,
      icon: Users,
      color: 'bg-blue-500',
      trend: 'stable',
    },
    {
      name: 'Total Transactions',
      value: stats?.tps || 0,
      icon: Activity,
      color: 'bg-green-500',
      trend: 'up',
    },
    {
      name: 'Cache Hit Ratio',
      value: `${stats?.cacheHitRatio || 0}%`,
      icon: HardDrive,
      color: 'bg-purple-500',
      status: (stats?.cacheHitRatio || 0) >= 90 ? 'good' : 'warning',
    },
    {
      name: 'Database Size',
      value: stats?.databaseSize || '0 B',
      icon: Database,
      color: 'bg-orange-500',
      trend: 'stable',
    },
  ];

  return (
    <div className="p-8">
      {/* Server Info */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
          {currentServer.name}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          {currentServer.host}:{currentServer.port} / {currentServer.database}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">
                    {stat.value}
                  </p>
                  {stat.status && (
                    <p className={`text-xs mt-1 ${
                      stat.status === 'good' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {stat.status === 'good' ? '✓ Healthy' : '⚠ Check config'}
                    </p>
                  )}
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Connection History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Connection Activity
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <XAxis dataKey="time" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line
                type="monotone"
                dataKey="connections"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cache Hit Ratio History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Cache Hit Ratio
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <XAxis dataKey="time" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line
                type="monotone"
                dataKey="cacheHit"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Queries */}
      {topQueries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Top Queries by Execution Time
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Query
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Calls
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Avg Time (ms)
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Time (ms)
                  </th>
                </tr>
              </thead>
              <tbody>
                {topQueries.slice(0, 5).map((query, idx) => (
                  <tr key={idx} className="border-b dark:border-gray-700">
                    <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-300 font-mono max-w-md truncate">
                      {query.query}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {query.calls.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {query.mean_exec_time.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {query.total_exec_time.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {topQueries.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
              No query data available. Make sure pg_stat_statements extension is installed.
            </p>
          )}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
        Auto-refreshing every 5 seconds
      </div>
    </div>
  );
}
