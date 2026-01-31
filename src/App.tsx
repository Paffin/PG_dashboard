import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ServerProvider } from './contexts/ServerContext';
import Layout from './components/Layout';
import ServersPage from './pages/ServersPage';
import DashboardPage from './pages/DashboardPage';
import MetricsPage from './pages/MetricsPage';
import ConfigurationPage from './pages/ConfigurationPage';
import IssuesPage from './pages/IssuesPage';
import './App.css';

function App() {
  return (
    <ServerProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<ServersPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/configuration" element={<ConfigurationPage />} />
            <Route path="/issues" element={<IssuesPage />} />
          </Routes>
        </Layout>
      </Router>
    </ServerProvider>
  );
}

export default App;
