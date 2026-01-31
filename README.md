# PG Dashboard - PostgreSQL Monitoring & Analysis Tool

A modern, cross-platform desktop application for monitoring and analyzing PostgreSQL databases. Built with Tauri, React, and Rust for optimal performance and minimal resource usage.

## Features

### 🔌 Connection Management
- Connect to multiple PostgreSQL servers (versions 11-17)
- Secure credential storage
- Connection testing before saving
- SSL/TLS support
- Easy server switching

### 📊 Real-time Metrics
- **Database Statistics**: Connections, transactions, cache hit ratio, deadlocks
- **Query Performance**: Top queries by execution time from `pg_stat_statements`
- **Active Queries**: Real-time view of running queries
- **Table Statistics**: Sequential scans, index usage, tuple operations, vacuum info
- **Index Statistics**: Index usage patterns, scan counts
- **Lock Information**: Current database locks and wait events
- **Background Writer Stats**: Checkpoint information, buffer statistics
- **Database Sizes**: Size tracking for all databases

### ⚙️ Configuration Analysis
- View all PostgreSQL settings from `pg_settings`
- Categorized and searchable configuration
- Source identification (config file, default, command line)
- Min/max value ranges

### 🔍 Intelligent Analysis
- **Hardware Detection**: Automatic detection of CPU, RAM, and storage type
- **Configuration Recommendations**: Based on actual hardware capabilities
  - `shared_buffers` optimization (25% RAM, max 8GB)
  - `effective_cache_size` tuning (50-75% RAM)
  - `work_mem` recommendations
  - `max_connections` validation
  - SSD vs HDD detection for `random_page_cost`

### 🚨 Performance Issue Detection
- **Low cache hit ratio** (<90%)
- **High sequential scans** on large tables (missing indexes)
- **Unused indexes** (never scanned)
- **Table bloat** detection
- **Lock contention** identification
- **VACUUM issues**
- Severity classification (Critical, Warning, Info)

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **TailwindCSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **React Router** for navigation

### Backend
- **Rust** for performance and safety
- **Tauri 2.x** for desktop application framework
  - ~30-40MB RAM usage (vs 200-400MB for Electron)
  - <10MB application size
  - <0.5s startup time
- **tokio-postgres** for async PostgreSQL connections
- **deadpool-postgres** for connection pooling

## Installation

### Prerequisites

- **Rust** (1.90+): Install from [rustup.rs](https://rustup.rs/)
- **Node.js** (22+): Install from [nodejs.org](https://nodejs.org/)
- **PostgreSQL** (11-17) server to connect to

### Building from Source

```bash
# Clone the repository
git clone <repository-url>
cd PG_dashboard

# Install dependencies
npm install

# Development mode
npm run tauri dev

# Production build
npm run tauri build
```

### Platform-Specific Builds

#### macOS (M1/M2/Intel)
```bash
npm run tauri build -- --target universal-apple-darwin
```

#### Windows
```bash
npm run tauri build -- --target x86_64-pc-windows-msvc
```

## Usage

### 1. Add a Server

Click **Add Server** and enter connection details:
- Server name (friendly name)
- Host (IP or hostname)
- Port (default: 5432)
- Database name
- Username
- Password
- SSL option

Use **Test Connection** to verify before saving.

### 2. View Dashboard

Select a connected server to view:
- Real-time metrics overview
- Active connections
- Query performance graphs
- Database size trends

### 3. Check Configuration

Navigate to **Configuration** to:
- Browse all PostgreSQL settings
- Search and filter parameters
- View current values and sources
- Check recommended values vs actual

### 4. Review Issues

Navigate to **Issues** to see:
- Configuration problems with severity levels
- Performance bottlenecks
- Recommended actions for each issue
- Detailed explanations

## PostgreSQL Extensions

For best results, enable these extensions on your PostgreSQL server:

```sql
-- Required for query performance tracking
CREATE EXTENSION pg_stat_statements;

-- Useful for additional monitoring (optional)
CREATE EXTENSION pg_buffercache;
CREATE EXTENSION pg_stat_kcache;
```

## Configuration Optimization Guidelines

### Memory Settings

| Parameter | Recommendation | Calculation |
|-----------|---------------|-------------|
| `shared_buffers` | 25% of RAM, max 8GB | `total_ram * 0.25` |
| `effective_cache_size` | 50-75% of RAM | `total_ram * 0.75` |
| `work_mem` | 10-50MB | Depends on connections |
| `maintenance_work_mem` | 256MB-2GB | For VACUUM, indexes |

### Connection Settings

| Parameter | Recommendation |
|-----------|---------------|
| `max_connections` | 50-200 | Based on CPU cores |

### Storage Settings

| Parameter | SSD | HDD |
|-----------|-----|-----|
| `random_page_cost` | 1.1 | 4.0 |
| `effective_io_concurrency` | 200 | 2 |

## Metrics Reference

### Key Performance Indicators

**Cache Hit Ratio**
```
Formula: (blks_hit / (blks_hit + blks_read)) * 100
Target: > 90%
```

**Transaction Rate**
```
Metric: xact_commit + xact_rollback per second
Interpretation: Database workload intensity
```

**Sequential Scans**
```
High seq_scans + seq_tup_read = potential missing indexes
Consider adding indexes for frequently scanned tables
```

## Troubleshooting

### Connection Issues

**Error: "Connection refused"**
- Check PostgreSQL is running
- Verify host and port are correct
- Check firewall rules
- Ensure `pg_hba.conf` allows connections

**Error: "pg_stat_statements not found"**
```sql
-- Add to postgresql.conf
shared_preload_libraries = 'pg_stat_statements'

-- Restart PostgreSQL
sudo systemctl restart postgresql

-- Create extension
CREATE EXTENSION pg_stat_statements;
```

### Permission Issues

Required permissions for monitoring:
```sql
-- Grant to monitoring user
GRANT pg_monitor TO your_monitoring_user;
GRANT CONNECT ON DATABASE your_database TO your_monitoring_user;
```

## Development

### Project Structure

```
PG_dashboard/
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── lib/               # API clients
│   └── types/             # TypeScript types
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── db/            # Database modules
│   │   │   ├── connection.rs    # Connection management
│   │   │   ├── metrics.rs       # Metrics types
│   │   │   ├── queries.rs       # Metric queries
│   │   │   ├── config.rs        # Configuration
│   │   │   └── analyzer.rs      # Analysis engine
│   │   └── commands/      # Tauri commands
│   └── Cargo.toml
└── package.json
```

### Adding New Metrics

1. Add types to `src-tauri/src/db/metrics.rs`
2. Add query to `src-tauri/src/db/queries.rs`
3. Add command to `src-tauri/src/commands/metrics_commands.rs`
4. Register in `src-tauri/src/lib.rs`
5. Add TypeScript types to `src/types/index.ts`
6. Add API call to `src/lib/api.ts`
7. Update UI components

## Performance

- **RAM Usage**: ~30-40MB (thanks to Tauri)
- **Startup Time**: <0.5 seconds
- **Package Size**: <10MB
- **Connection Pooling**: Efficient connection reuse
- **Async Operations**: Non-blocking database queries

## Roadmap

- [ ] Historical metrics storage and graphs
- [ ] Query explain plan visualization
- [ ] Automated performance reports (PDF export)
- [ ] Alert notifications
- [ ] Multi-server comparison
- [ ] Dark/light theme toggle
- [ ] Custom dashboard layouts
- [ ] Import/export server configurations

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with [Tauri](https://tauri.app/)
- Inspired by pgAdmin, pganalyze, and other PostgreSQL tools
- Configuration recommendations based on [PGTune](https://pgtune.leopard.in.ua/)

## Support

For issues and questions:
- GitHub Issues: <repository-url>/issues
- Documentation: This README

---

**Made with ❤️ for the PostgreSQL community**
