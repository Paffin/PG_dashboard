# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PG Dashboard is a cross-platform desktop application for PostgreSQL monitoring and performance analysis. Built with Tauri 2.x (Rust backend), React 18 (TypeScript frontend), and TailwindCSS.

## Build & Development Commands

```bash
# Development - Full desktop app with hot reload
npm run tauri dev

# Frontend only development
npm run dev

# Production build
npm run tauri build

# Rust-specific commands (from src-tauri/)
cargo check    # Type-check without building
cargo fmt      # Format Rust code
```

## Architecture

### Frontend (`src/`)
- **Entry**: `main.tsx` → `App.tsx` (React Router setup)
- **State**: `contexts/ServerContext.tsx` - Global server selection state
- **API Layer**: `lib/api.ts` - Wraps all 17 Tauri IPC commands
- **Types**: `types/index.ts` - TypeScript interfaces for all data structures
- **Pages**: ServersPage (connection management), DashboardPage (metrics), IssuesPage (analysis)

### Backend (`src-tauri/src/`)
- **Entry**: `lib.rs` (Tauri setup, command registration) → `main.rs`
- **Commands**: `commands/` - Tauri command handlers organized by domain
- **Database**: `db/` - PostgreSQL connection pooling, queries, metrics, analysis
- **Connection Pool**: Uses `deadpool-postgres` singleton via `ConnectionManager`

### Tauri Command Categories
1. **Connection**: `test_connection`, `add_server`, `remove_server`, `get_server_info`, `list_servers`
2. **Metrics**: `get_database_stats`, `get_top_queries`, `get_active_queries`, `get_table_stats`, `get_index_stats`, `get_locks`, `get_bgwriter_stats`, `get_database_sizes`
3. **Config**: `get_all_settings`, `get_hardware_info`
4. **Analysis**: `analyze_configuration`, `detect_performance_issues`

## Key Patterns

### Adding New Features
1. Add Tauri command in `src-tauri/src/commands/`
2. Register in `generate_handler!` macro in `src-tauri/src/lib.rs`
3. Add TypeScript wrapper in `src/lib/api.ts`
4. Define types in `src/types/index.ts`
5. Use via `api.commandName()` in React components

### Frontend Conventions
- All pages access current server via `useServer()` hook from ServerContext
- Data fetching happens directly via `api.*` calls (no Redux/React Query)
- Dashboard auto-refreshes every 5 seconds
- TailwindCSS utilities only, no custom CSS-in-JS

### Backend Conventions
- Commands return `Result<T, String>` which Tauri serializes to JSON
- All database queries are in `db/queries.rs`
- Connection pooling handled automatically by `ConnectionManager`

## PostgreSQL Requirements

Requires `pg_stat_statements` extension for query statistics:
```sql
CREATE EXTENSION pg_stat_statements;
```

Uses system views: `pg_stat_database`, `pg_stat_statements`, `pg_stat_activity`, `pg_stat_user_tables`, `pg_stat_user_indexes`, `pg_locks`, `pg_stat_bgwriter`, `pg_settings`

## Configuration Notes

- Vite dev server runs on port 1420 (required by Tauri)
- TypeScript strict mode enabled
- Passwords are not serialized when storing server configs (security)
