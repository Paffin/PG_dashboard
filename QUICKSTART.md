# Quick Start Guide

## Project Status

✅ **Backend**: Fully implemented and tested
✅ **Frontend Structure**: Created with routing and layout
⚠️ **UI Integration**: Needs data integration with backend APIs

## What's Working

1. **Tauri Application**: Builds and runs
2. **Server Management**: Add, remove, test connections
3. **Backend APIs**: All 17 Tauri commands ready
   - Connection management (5 commands)
   - Metrics collection (8 commands)
   - Configuration (2 commands)
   - Analysis (2 commands)

## Quick Test

### 1. Start Development Server

```bash
npm run tauri dev
```

This will:
- Build Rust backend (~1-2 min first time)
- Start React frontend
- Open desktop application

### 2. Add a PostgreSQL Server

1. Click "Add Server" button
2. Fill in connection details:
   - Name: My Test Server
   - Host: localhost
   - Port: 5432
   - Database: postgres
   - Username: postgres
   - Password: your_password
3. Click "Test Connection" to verify
4. Click "Add Server" to save

### 3. Explore Pages

Currently implemented:
- ✅ **Servers** - Fully functional
- ⚠️ **Dashboard** - UI ready, needs data integration
- ⚠️ **Metrics** - Placeholder
- ⚠️ **Configuration** - Placeholder
- ⚠️ **Issues** - Placeholder

## Backend API Examples

All these work and can be tested:

```typescript
import { invoke } from '@tauri-apps/api/core';

// Test connection
const result = await invoke('test_connection', {
  config: {
    id: crypto.randomUUID(),
    name: 'Test',
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    username: 'postgres',
    password: 'password',
    use_ssl: false,
  }
});

// Get database stats
const stats = await invoke('get_database_stats', {
  serverId: 'your-server-id'
});

// Get top queries (requires pg_stat_statements)
const queries = await invoke('get_top_queries', {
  serverId: 'your-server-id',
  limit: 10
});

// Analyze configuration
const issues = await invoke('analyze_configuration', {
  serverId: 'your-server-id'
});
```

## What Needs to Be Done

### Priority 1: Dashboard Page

**File**: `src/pages/DashboardPage.tsx`

Replace the placeholder with real data:

```typescript
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

// Get server ID from your state management or context
const serverId = 'your-server-id';

const [stats, setStats] = useState(null);

useEffect(() => {
  const loadStats = async () => {
    try {
      const data = await api.getDatabaseStats(serverId);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  loadStats();
  const interval = setInterval(loadStats, 5000); // Auto-refresh
  return () => clearInterval(interval);
}, [serverId]);
```

### Priority 2: Issues Page

**File**: `src/pages/IssuesPage.tsx`

Show configuration and performance issues:

```typescript
const [configIssues, setConfigIssues] = useState([]);
const [perfIssues, setPerfIssues] = useState([]);

useEffect(() => {
  const loadIssues = async () => {
    const config = await api.analyzeConfiguration(serverId);
    const perf = await api.detectPerformanceIssues(serverId);
    setConfigIssues(config);
    setPerfIssues(perf);
  };
  loadIssues();
}, [serverId]);
```

### Priority 3: Server Context

Create a context to track the currently selected server:

**File**: `src/contexts/ServerContext.tsx`

```typescript
import { createContext, useContext, useState } from 'react';

const ServerContext = createContext(null);

export function ServerProvider({ children }) {
  const [currentServerId, setCurrentServerId] = useState(null);

  return (
    <ServerContext.Provider value={{ currentServerId, setCurrentServerId }}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServer() {
  return useContext(ServerContext);
}
```

Then wrap your app:

```typescript
// src/App.tsx
import { ServerProvider } from './contexts/ServerContext';

function App() {
  return (
    <ServerProvider>
      <Router>
        <Layout>
          <Routes>...</Routes>
        </Layout>
      </Router>
    </ServerProvider>
  );
}
```

## Testing Backend Commands

You can test backend commands directly in the browser console when the app is running:

```javascript
// In browser DevTools console
const { invoke } = window.__TAURI__.core;

// List all servers
invoke('list_servers').then(console.log);

// Get database stats (replace with actual server ID)
invoke('get_database_stats', {
  serverId: 'your-server-id-here'
}).then(console.log);
```

## PostgreSQL Setup for Full Features

### Enable pg_stat_statements

```sql
-- Add to postgresql.conf
shared_preload_libraries = 'pg_stat_statements'

-- Restart PostgreSQL
-- Then:
CREATE EXTENSION pg_stat_statements;
```

### Grant Monitoring Permissions

```sql
-- For dedicated monitoring user
CREATE USER pg_monitor_user WITH PASSWORD 'secure_password';
GRANT pg_monitor TO pg_monitor_user;
GRANT CONNECT ON DATABASE your_database TO pg_monitor_user;
```

## Build for Production

```bash
# Build everything
npm run tauri build

# Output locations:
# - Windows: src-tauri/target/release/pg-dashboard.exe
# - macOS: src-tauri/target/release/bundle/macos/
# - Linux: src-tauri/target/release/bundle/appimage/
```

## Troubleshooting

### Rust Build Fails

Make sure you have all Tauri prerequisites:
- [Windows](https://tauri.app/v2/guides/prerequisites/#windows)
- [macOS](https://tauri.app/v2/guides/prerequisites/#macos)
- [Linux](https://tauri.app/v2/guides/prerequisites/#linux)

### Connection Fails

1. Check PostgreSQL is running: `pg_isready`
2. Check `pg_hba.conf` allows connections
3. Verify credentials are correct
4. Check firewall settings

### UI Shows No Data

Check browser console for errors. Backend commands might be returning errors that aren't displayed in UI yet.

## Next Steps

1. Read `NEXT_STEPS.md` for detailed implementation guide
2. Start with Dashboard page (Task 5)
3. Then implement Issues page (Task 10)
4. Add server selection context
5. Test on target platforms

## Support

- Check `README.md` for full documentation
- Review `NEXT_STEPS.md` for remaining tasks
- Backend code: `src-tauri/src/`
- Frontend code: `src/`

---

The foundation is solid! Focus on connecting the UI to the backend APIs and you'll have a fully functional PostgreSQL monitoring tool.
