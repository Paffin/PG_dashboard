import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Database,
  Activity,
  Settings,
  AlertTriangle,
  Server,
  LayoutDashboard,
  ChevronRight,
  Radio,
  Menu,
  X,
  Keyboard,
} from 'lucide-react';
import { useServer } from '../contexts/ServerContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { currentServer } = useServer();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onShowHelp: () => setShowShortcuts(true),
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigation = [
    { name: 'Servers', path: '/', icon: Server },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Metrics', path: '/metrics', icon: Activity },
    { name: 'Configuration', path: '/configuration', icon: Settings },
    { name: 'Issues', path: '/issues', icon: AlertTriangle },
  ];

  const getPageTitle = () => {
    const current = navigation.find(n => n.path === location.pathname);
    return current?.name || 'Dashboard';
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-[var(--border-subtle)]">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--primary-muted)]">
            <Database className="w-[18px] h-[18px] text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-[var(--text-primary)] leading-tight">
            PG Dashboard
          </h1>
          <p className="text-[11px] text-[var(--text-tertiary)]">
            PostgreSQL Monitor
          </p>
        </div>
        {/* Close button on mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 -mr-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Server Status */}
      {currentServer && (
        <div className="mx-4 mt-4 p-3.5 rounded-xl bg-[var(--primary-muted)] border border-[var(--primary)]/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="status-dot status-online" />
            <span className="text-[11px] font-semibold text-[var(--primary)] uppercase tracking-wider">
              Connected
            </span>
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)] truncate" title={currentServer.name}>
            {currentServer.name}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] font-mono truncate mt-0.5" title={`${currentServer.host}:${currentServer.port}`}>
            {currentServer.host}:{currentServer.port}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const needsServer = item.path !== '/';
          const isDisabled = needsServer && !currentServer;

          return (
            <Link
              key={item.path}
              to={isDisabled ? '#' : item.path}
              onClick={(e) => isDisabled && e.preventDefault()}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-150
                ${isActive
                  ? 'bg-[var(--primary-muted)] text-[var(--primary)]'
                  : isDisabled
                    ? 'text-[var(--text-muted)] cursor-not-allowed'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }
              `}
            >
              <Icon className={`w-[18px] h-[18px] transition-transform duration-150 ${!isDisabled && !isActive && 'group-hover:scale-110'}`} />
              <span className="text-sm font-medium">{item.name}</span>
              {isActive && (
                <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)] font-mono">v1.0.0</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowShortcuts(true)}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-[var(--success)]" />
              <span className="text-[11px] text-[var(--text-tertiary)]">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-[260px] flex-col bg-[var(--bg-surface)] border-r border-[var(--border-subtle)]">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col
          bg-[var(--bg-surface)] border-r border-[var(--border-subtle)]
          transform transition-transform duration-300 ease-in-out
          lg:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 px-4 lg:px-6 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
              {getPageTitle()}
            </h2>
            {currentServer && location.pathname !== '/' && (
              <span className="hidden sm:flex items-center gap-3">
                <span className="text-[var(--text-muted)]">/</span>
                <span className="text-[13px] text-[var(--text-tertiary)] truncate max-w-[150px]">
                  {currentServer.name}
                </span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-[var(--text-tertiary)] font-mono tabular-nums hidden sm:block">
              {currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="min-h-full">
            {children}
          </div>
        </div>
      </main>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  );
}
