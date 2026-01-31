import { createContext, useContext, useState, ReactNode } from 'react';
import type { ServerInfo } from '../types';

interface ServerContextType {
  currentServer: ServerInfo | null;
  setCurrentServer: (server: ServerInfo | null) => void;
  serverId: string | null;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export function ServerProvider({ children }: { children: ReactNode }) {
  const [currentServer, setCurrentServer] = useState<ServerInfo | null>(null);

  return (
    <ServerContext.Provider
      value={{
        currentServer,
        setCurrentServer,
        serverId: currentServer?.id || null,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
}

export function useServer() {
  const context = useContext(ServerContext);
  if (context === undefined) {
    throw new Error('useServer must be used within a ServerProvider');
  }
  return context;
}
