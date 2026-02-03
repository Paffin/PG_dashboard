# Changelog

All notable changes to PG Dashboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2024-XX-XX

### Added

- **Real-time Dashboard**
  - Live connection tracking
  - Transaction throughput monitoring
  - Cache hit ratio with historical charts
  - Database size monitoring
  - Auto-refresh every 5 seconds

- **Query Analysis**
  - Active queries viewer with state tracking
  - Top queries by execution time
  - EXPLAIN plan visualization
  - pg_stat_statements integration

- **Configuration Analysis**
  - Browse all PostgreSQL settings
  - Automatic hardware-based recommendations
  - Security best practices validation
  - Severity classification (Critical/Warning/Info)

- **Performance Diagnostics**
  - Table statistics & bloat detection
  - Index usage analysis (find unused indexes)
  - Lock monitoring with wait events
  - Background writer stats
  - Dead tuple tracking

- **Server Management**
  - Multiple server connections
  - Server groups (Production/Staging/Dev)
  - Secure credential storage (OS keychain)
  - Connection testing

- **User Experience**
  - Modern dark theme
  - Responsive design (mobile sidebar)
  - Keyboard shortcuts (vim-style navigation)
  - Export to CSV/JSON
  - Copy to clipboard

- **Cross-platform Support**
  - Windows (x64)
  - macOS (Intel & Apple Silicon)
  - Linux (x64, AppImage & .deb)

### Technical

- Built with Tauri 2.0, React 18, TypeScript, Rust
- ~40MB RAM usage
- <15MB application size
- <1s startup time
- Lazy loading for pages
- Code splitting for optimal bundle size

---

## Version History

- `1.0.0` - Initial release

[Unreleased]: https://github.com/anthropics/pg-dashboard/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/anthropics/pg-dashboard/releases/tag/v1.0.0
