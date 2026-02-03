import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { ServerGroup } from '../types';

const STORAGE_KEY = 'pg_dashboard_server_groups';

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

interface ServerGroupsContextType {
  groups: ServerGroup[];
  createGroup: (name: string, color?: string) => ServerGroup;
  updateGroup: (id: string, updates: Partial<Omit<ServerGroup, 'id'>>) => void;
  deleteGroup: (id: string) => void;
  addServerToGroup: (groupId: string, serverId: string) => void;
  removeServerFromGroup: (groupId: string, serverId: string) => void;
  getServerGroup: (serverId: string) => ServerGroup | undefined;
  moveServerToGroup: (serverId: string, groupId: string | null) => void;
}

const ServerGroupsContext = createContext<ServerGroupsContextType | null>(null);

export function ServerGroupsProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<ServerGroup[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  }, [groups]);

  const createGroup = useCallback((name: string, color?: string): ServerGroup => {
    const usedColors = new Set(groups.map(g => g.color));
    const availableColor = color || DEFAULT_COLORS.find(c => !usedColors.has(c)) || DEFAULT_COLORS[0];

    const newGroup: ServerGroup = {
      id: `group_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name,
      color: availableColor,
      serverIds: [],
    };

    setGroups(prev => [...prev, newGroup]);
    return newGroup;
  }, [groups]);

  const updateGroup = useCallback((id: string, updates: Partial<Omit<ServerGroup, 'id'>>) => {
    setGroups(prev =>
      prev.map(group =>
        group.id === id ? { ...group, ...updates } : group
      )
    );
  }, []);

  const deleteGroup = useCallback((id: string) => {
    setGroups(prev => prev.filter(group => group.id !== id));
  }, []);

  const addServerToGroup = useCallback((groupId: string, serverId: string) => {
    setGroups(prev =>
      prev.map(group => {
        // Remove from other groups first
        if (group.id !== groupId && group.serverIds.includes(serverId)) {
          return {
            ...group,
            serverIds: group.serverIds.filter(id => id !== serverId),
          };
        }
        // Add to target group
        if (group.id === groupId && !group.serverIds.includes(serverId)) {
          return {
            ...group,
            serverIds: [...group.serverIds, serverId],
          };
        }
        return group;
      })
    );
  }, []);

  const removeServerFromGroup = useCallback((groupId: string, serverId: string) => {
    setGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? { ...group, serverIds: group.serverIds.filter(id => id !== serverId) }
          : group
      )
    );
  }, []);

  const getServerGroup = useCallback((serverId: string): ServerGroup | undefined => {
    return groups.find(group => group.serverIds.includes(serverId));
  }, [groups]);

  const moveServerToGroup = useCallback((serverId: string, groupId: string | null) => {
    setGroups(prev =>
      prev.map(group => {
        const hasServer = group.serverIds.includes(serverId);

        if (groupId === null) {
          // Remove from all groups
          if (hasServer) {
            return {
              ...group,
              serverIds: group.serverIds.filter(id => id !== serverId),
            };
          }
        } else if (group.id === groupId) {
          // Add to target group
          if (!hasServer) {
            return {
              ...group,
              serverIds: [...group.serverIds, serverId],
            };
          }
        } else if (hasServer) {
          // Remove from other groups
          return {
            ...group,
            serverIds: group.serverIds.filter(id => id !== serverId),
          };
        }

        return group;
      })
    );
  }, []);

  const value: ServerGroupsContextType = {
    groups,
    createGroup,
    updateGroup,
    deleteGroup,
    addServerToGroup,
    removeServerFromGroup,
    getServerGroup,
    moveServerToGroup,
  };

  return (
    <ServerGroupsContext.Provider value={value}>
      {children}
    </ServerGroupsContext.Provider>
  );
}

export function useServerGroups() {
  const context = useContext(ServerGroupsContext);
  if (!context) {
    throw new Error('useServerGroups must be used within a ServerGroupsProvider');
  }
  return context;
}
