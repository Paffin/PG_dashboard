import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ServerProvider } from './contexts/ServerContext';
import { ServerGroupsProvider } from './contexts/ServerGroupsContext';
import { ToastProvider } from './contexts/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import { Skeleton } from './components/ui';
import './App.css';

// Eager load the landing page
import ServersPage from './pages/ServersPage';

// Lazy load other pages for code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MetricsPage = lazy(() => import('./pages/MetricsPage'));
const ConfigurationPage = lazy(() => import('./pages/ConfigurationPage'));
const IssuesPage = lazy(() => import('./pages/IssuesPage'));

// Loading fallback for lazy-loaded pages
function PageLoader() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} variant="stat-card" />
        ))}
      </div>
      <Skeleton variant="card" />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ServerGroupsProvider>
          <ServerProvider>
          <Router>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<ServersPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/metrics" element={<MetricsPage />} />
                  <Route path="/configuration" element={<ConfigurationPage />} />
                  <Route path="/issues" element={<IssuesPage />} />
                </Routes>
              </Suspense>
            </Layout>
          </Router>
          </ServerProvider>
        </ServerGroupsProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
