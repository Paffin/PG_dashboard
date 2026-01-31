import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Database,
  Activity,
  Settings,
  AlertTriangle,
  Server,
  BarChart3
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navigation = [
    { name: 'Servers', path: '/', icon: Server },
    { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
    { name: 'Metrics', path: '/metrics', icon: Activity },
    { name: 'Configuration', path: '/configuration', icon: Settings },
    { name: 'Issues', path: '/issues', icon: AlertTriangle },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-lg">
        <div className="flex items-center gap-2 p-4 border-b dark:border-gray-700">
          <Database className="w-8 h-8 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            PG Dashboard
          </h1>
        </div>

        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
