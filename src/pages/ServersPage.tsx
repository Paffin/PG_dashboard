import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Server, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import type { ServerInfo } from '../types';
import AddServerModal from '../components/AddServerModal';
import { useServer } from '../contexts/ServerContext';

export default function ServersPage() {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { setCurrentServer } = useServer();
  const navigate = useNavigate();

  const loadServers = async () => {
    try {
      const serverList = await api.listServers();
      setServers(serverList);
    } catch (error) {
      console.error('Failed to load servers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServers();
  }, []);

  const handleRemoveServer = async (id: string) => {
    if (confirm('Are you sure you want to remove this server?')) {
      try {
        await api.removeServer(id);
        await loadServers();
      } catch (error) {
        alert(`Failed to remove server: ${error}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">Loading servers...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
          PostgreSQL Servers
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Server
        </button>
      </div>

      {servers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <Server className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No servers configured
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Add your first PostgreSQL server to start monitoring
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Server
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servers.map((server) => (
            <div
              key={server.id}
              onClick={() => {
                if (server.connected) {
                  setCurrentServer(server);
                  navigate('/dashboard');
                }
              }}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-all relative ${
                server.connected ? 'hover:shadow-lg cursor-pointer hover:border-blue-500 border-2 border-transparent' : 'opacity-75'
              }`}
            >
              <button
                onClick={() => handleRemoveServer(server.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove server"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex items-start justify-between mb-4 pr-8">
                <div className="flex items-center gap-3">
                  <Server className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      {server.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {server.host}:{server.port}
                    </p>
                  </div>
                </div>
                {server.connected ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>Database: {server.database}</p>
                <p>User: {server.username}</p>
                <p className={server.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  Status: {server.connected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddServerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadServers();
          }}
        />
      )}
    </div>
  );
}
