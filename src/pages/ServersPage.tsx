import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Server,
  Trash2,
  ArrowRight,
  Wifi,
  WifiOff,
  Database,
  Loader2,
  RefreshCw,
  FolderPlus,
  MoreVertical,
  FolderOpen,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import type { ServerInfo } from '../types';
import AddServerModal from '../components/AddServerModal';
import { Badge } from '../components/ui';
import { useServer } from '../contexts/ServerContext';
import { useServerGroups } from '../contexts/ServerGroupsContext';
import { useToast } from '../contexts/ToastContext';

export default function ServersPage() {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState<string | null>(null);
  const [showGroupMenu, setShowGroupMenu] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const { setCurrentServer, serverId } = useServer();
  const { groups, createGroup, deleteGroup, getServerGroup, moveServerToGroup } = useServerGroups();
  const { toast } = useToast();
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

  // Close menus on outside click
  useEffect(() => {
    const handleClick = () => {
      setShowGroupMenu(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleRemoveServer = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Remove this server from the list?')) {
      try {
        await api.removeServer(id);
        await loadServers();
      } catch (error) {
        toast.error(`Failed to remove server: ${error}`);
      }
    }
  };

  const handleSelectServer = (server: ServerInfo) => {
    if (server.connected) {
      setCurrentServer(server);
      navigate('/dashboard');
    }
  };

  const handleReconnect = async (e: React.MouseEvent, server: ServerInfo) => {
    e.stopPropagation();
    setReconnecting(server.id);
    try {
      await api.reconnectServer(server.id);
      await loadServers();
    } catch (error) {
      toast.error(`Failed to reconnect: ${error}`);
    } finally {
      setReconnecting(null);
    }
  };

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      createGroup(newGroupName.trim());
      setNewGroupName('');
      setShowCreateGroup(false);
      toast.success(`Group "${newGroupName.trim()}" created`);
    }
  };

  const handleAssignGroup = (e: React.MouseEvent, serverId: string, groupId: string | null) => {
    e.stopPropagation();
    moveServerToGroup(serverId, groupId);
    setShowGroupMenu(null);
  };

  const handleDeleteGroup = (e: React.MouseEvent, groupId: string, groupName: string) => {
    e.stopPropagation();
    if (confirm(`Delete group "${groupName}"? Servers will not be deleted.`)) {
      deleteGroup(groupId);
      toast.success(`Group "${groupName}" deleted`);
    }
  };

  // Organize servers by groups
  const organizedServers = useMemo(() => {
    const grouped: { group: typeof groups[0] | null; servers: ServerInfo[] }[] = [];

    // First, add servers in groups
    groups.forEach(group => {
      const groupServers = servers.filter(s => group.serverIds.includes(s.id));
      if (groupServers.length > 0) {
        grouped.push({ group, servers: groupServers });
      }
    });

    // Then, add ungrouped servers
    const groupedServerIds = new Set(groups.flatMap(g => g.serverIds));
    const ungroupedServers = servers.filter(s => !groupedServerIds.has(s.id));
    if (ungroupedServers.length > 0 || grouped.length === 0) {
      grouped.push({ group: null, servers: ungroupedServers });
    }

    return grouped;
  }, [servers, groups]);

  const connectedCount = servers.filter(s => s.connected).length;
  const offlineCount = servers.filter(s => !s.connected).length;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
          <p className="text-[var(--text-secondary)] text-sm">Loading servers...</p>
        </div>
      </div>
    );
  }

  const renderServerCard = (server: ServerInfo, index: number) => {
    const serverGroup = getServerGroup(server.id);

    return (
      <div
        key={server.id}
        onClick={() => handleSelectServer(server)}
        className={`
          card p-5 relative group
          transition-all duration-200
          animate-fade-in-up
          ${server.connected ? 'cursor-pointer card-hover' : 'opacity-60'}
          ${serverId === server.id ? 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--bg-base)]' : ''}
        `}
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Group menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowGroupMenu(showGroupMenu === server.id ? null : server.id);
              }}
              className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all duration-150"
              title="Assign to group"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showGroupMenu === server.id && (
              <div
                className="absolute right-0 top-full mt-1 w-48 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-xl z-20 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2 border-b border-[var(--border-subtle)]">
                  <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider px-2 py-1">
                    Assign to Group
                  </p>
                </div>
                <div className="p-1">
                  <button
                    onClick={(e) => handleAssignGroup(e, server.id, null)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2 ${
                      !serverGroup
                        ? 'bg-[var(--primary-muted)] text-[var(--primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-[var(--text-muted)]" />
                    No Group
                  </button>
                  {groups.map(g => (
                    <button
                      key={g.id}
                      onClick={(e) => handleAssignGroup(e, server.id, g.id)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2 ${
                        serverGroup?.id === g.id
                          ? 'bg-[var(--primary-muted)] text-[var(--primary)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Delete button */}
          <button
            onClick={(e) => handleRemoveServer(e, server.id)}
            className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-muted)] transition-all duration-150"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Group indicator */}
        {serverGroup && (
          <div
            className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
            style={{ backgroundColor: serverGroup.color }}
          />
        )}

        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`
            w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
            ${server.connected
              ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]'
              : 'bg-[var(--bg-elevated)]'
            }
          `}>
            <Server className={`w-5 h-5 ${server.connected ? 'text-white' : 'text-[var(--text-tertiary)]'}`} />
          </div>
          <div className="flex-1 min-w-0 pr-16">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-[var(--text-primary)] truncate">
                {server.name}
              </h3>
              {serverId === server.id && (
                <Badge variant="primary" size="xs">Active</Badge>
              )}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] font-mono truncate">
              {server.host}:{server.port}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-tertiary)]">Database</span>
            <span className="text-[var(--text-primary)] font-medium">{server.database}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-tertiary)]">User</span>
            <span className="text-[var(--text-primary)] font-medium">{server.username}</span>
          </div>
          {server.postgres_version && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-tertiary)]">Version</span>
              <span className="text-[var(--text-primary)] font-mono text-xs">
                {server.postgres_version.split(' ')[0]}
              </span>
            </div>
          )}
        </div>

        {/* Status Footer */}
        <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`status-dot ${server.connected ? 'status-online' : 'status-offline'}`} />
            <span className={`text-sm font-medium ${
              server.connected ? 'text-[var(--success)]' : 'text-[var(--error)]'
            }`}>
              {server.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {server.connected ? (
            <div className="flex items-center gap-1 text-[var(--primary)] text-sm font-medium">
              <span>Open</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          ) : (
            <button
              onClick={(e) => handleReconnect(e, server)}
              disabled={reconnecting === server.id}
              className="btn btn-sm btn-secondary"
            >
              {reconnecting === server.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Reconnect</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">
            Server Fleet
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Manage your PostgreSQL connections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateGroup(true)}
            className="btn btn-secondary"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Group</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Server
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[var(--accent-muted)]">
            <Server className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-[var(--text-primary)]">{servers.length}</p>
            <p className="text-xs text-[var(--text-tertiary)]">Total Servers</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[var(--success-muted)]">
            <Wifi className="w-5 h-5 text-[var(--success)]" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-[var(--text-primary)]">{connectedCount}</p>
            <p className="text-xs text-[var(--text-tertiary)]">Connected</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[var(--error-muted)]">
            <WifiOff className="w-5 h-5 text-[var(--error)]" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-[var(--text-primary)]">{offlineCount}</p>
            <p className="text-xs text-[var(--text-tertiary)]">Offline</p>
          </div>
        </div>
      </div>

      {/* Server Grid */}
      {servers.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center">
            <Database className="w-8 h-8 text-[var(--text-tertiary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            No servers configured
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
            Add your first PostgreSQL server to start monitoring performance and health metrics
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Your First Server
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {organizedServers.map(({ group, servers: groupServers }) => (
            <div key={group?.id || 'ungrouped'}>
              {/* Group Header */}
              {group ? (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      {group.name}
                    </h2>
                    <Badge variant="default" size="sm">{groupServers.length}</Badge>
                  </div>
                  <button
                    onClick={(e) => handleDeleteGroup(e, group.id, group.name)}
                    className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-muted)] transition-all"
                    title="Delete group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : groups.length > 0 ? (
                <div className="flex items-center gap-3 mb-4">
                  <FolderOpen className="w-5 h-5 text-[var(--text-tertiary)]" />
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Ungrouped
                  </h2>
                  <Badge variant="default" size="sm">{groupServers.length}</Badge>
                </div>
              ) : null}

              {/* Server Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groupServers.map((server, index) => renderServerCard(server, index))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateGroup(false)}
          />
          <div className="relative w-full max-w-sm mx-4 bg-[var(--bg-surface)] rounded-xl shadow-2xl border border-[var(--border-default)] animate-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Create Group
              </h2>
              <button
                onClick={() => setShowCreateGroup(false)}
                className="p-2 -mr-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., Production, Staging"
                className="input w-full"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
              />
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-base)] rounded-b-xl">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="btn btn-primary"
              >
                Create
              </button>
            </div>
          </div>
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
