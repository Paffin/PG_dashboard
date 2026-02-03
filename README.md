<p align="center">
  <img src="src-tauri/icons/128x128@2x.png" alt="PG Dashboard Logo" width="128" height="128">
</p>

<h1 align="center">PG Dashboard</h1>

<p align="center">
  <strong>A modern, blazing-fast PostgreSQL monitoring and performance analysis tool</strong>
</p>

<p align="center">
  Built with Tauri, React, and Rust for maximum performance and minimal footprint
</p>

<p align="center">
  <a href="https://github.com/anthropics/pg-dashboard/actions/workflows/build.yml">
    <img src="https://github.com/anthropics/pg-dashboard/actions/workflows/build.yml/badge.svg" alt="Build Status">
  </a>
  <a href="https://github.com/anthropics/pg-dashboard/releases">
    <img src="https://img.shields.io/github/v/release/anthropics/pg-dashboard?include_prereleases&style=flat&color=blue" alt="Release">
  </a>
  <a href="https://github.com/anthropics/pg-dashboard/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  </a>
  <img src="https://img.shields.io/badge/PostgreSQL-11--17-336791?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri&logoColor=white" alt="Tauri">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-858585" alt="Platform">
  <img src="https://img.shields.io/badge/RAM-~40MB-purple" alt="Memory">
  <img src="https://img.shields.io/badge/size-<15MB-orange" alt="Size">
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-installation">Installation</a> •
  <a href="#%EF%B8%8F-quick-start">Quick Start</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-development">Development</a> •
  <a href="#-roadmap">Roadmap</a>
</p>

---

## Why PG Dashboard?

| Feature | PG Dashboard | pgAdmin | DataGrip |
|---------|:------------:|:-------:|:--------:|
| Memory Usage | **~40MB** | ~500MB | ~1.5GB |
| Startup Time | **<1s** | ~5s | ~10s |
| Real-time Monitoring | ✅ | ❌ | ❌ |
| Auto Issue Detection | ✅ | ❌ | ❌ |
| Native Performance | ✅ (Rust) | ❌ (Python) | ❌ (Java) |
| Cross-platform | ✅ | ✅ | ✅ |
| Free & Open Source | ✅ | ✅ | ❌ |

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📊 Real-time Dashboard
- Live connection tracking
- Transaction throughput (TPS)
- Cache hit ratio with historical charts
- Database size monitoring
- Auto-refresh every 5 seconds

</td>
<td width="50%">

### 🔍 Query Intelligence
- Active queries viewer with state tracking
- Top queries by execution time
- **EXPLAIN plan visualization**
- Query performance insights
- pg_stat_statements integration

</td>
</tr>
<tr>
<td width="50%">

### 🛠️ Smart Configuration Analysis
- Browse all PostgreSQL settings
- **Automatic recommendations** based on hardware
- Security best practices validation
- One-click issue detection
- Severity classification (Critical/Warning/Info)

</td>
<td width="50%">

### 📈 Performance Diagnostics
- Table statistics & bloat detection
- Index usage analysis (find unused indexes)
- Lock monitoring with wait events
- Background writer stats
- Dead tuple tracking for VACUUM

</td>
</tr>
</table>

### 🎯 Additional Features

| Feature | Description |
|---------|-------------|
| 🖥️ **Cross-platform** | Native apps for Windows, macOS (Intel & Apple Silicon), Linux |
| 🔒 **Secure** | Passwords stored in OS keychain (Windows Credential Manager, macOS Keychain, Linux Secret Service) |
| 🎨 **Modern UI** | Beautiful dark theme with responsive design |
| ⌨️ **Keyboard Shortcuts** | Navigate with vim-style shortcuts (`g+d` → Dashboard, `?` → Help) |
| 📁 **Server Groups** | Organize servers by environment (Production, Staging, Dev) |
| 📤 **Export Data** | Export any table to CSV/JSON, one-click clipboard copy |
| 🔄 **Smart Refresh** | Auto-refresh with request accumulation prevention |
| 🚀 **Lightweight** | ~40MB RAM, <15MB disk, <1s startup |

---

## 📸 Screenshots

<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="Dashboard" width="90%">
  <br>
  <em>Real-time dashboard with connection activity and cache hit ratio charts</em>
</p>

<details>
<summary><b>View more screenshots</b></summary>

<p align="center">
  <img src="docs/screenshots/servers.png" alt="Server Management" width="90%">
  <br>
  <em>Server management with groups and connection status</em>
</p>

<p align="center">
  <img src="docs/screenshots/metrics.png" alt="Metrics" width="90%">
  <br>
  <em>Detailed metrics: tables, indexes, locks, background writer</em>
</p>

<p align="center">
  <img src="docs/screenshots/issues.png" alt="Issues" width="90%">
  <br>
  <em>Automatic configuration and performance issue detection</em>
</p>

<p align="center">
  <img src="docs/screenshots/explain.png" alt="EXPLAIN Plan" width="90%">
  <br>
  <em>Query execution plan visualization</em>
</p>

</details>

---

## 📦 Installation

### Download Pre-built Binaries

| Platform | Architecture | Download |
|----------|--------------|----------|
| **Windows** | x64 | [📥 PG-Dashboard-Setup.exe](https://github.com/anthropics/pg-dashboard/releases/latest) |
| **macOS** | Apple Silicon (M1/M2/M3) | [📥 PG-Dashboard-arm64.dmg](https://github.com/anthropics/pg-dashboard/releases/latest) |
| **macOS** | Intel | [📥 PG-Dashboard-x64.dmg](https://github.com/anthropics/pg-dashboard/releases/latest) |
| **Linux** | x64 | [📥 PG-Dashboard.AppImage](https://github.com/anthropics/pg-dashboard/releases/latest) |
| **Linux** | x64 (Debian/Ubuntu) | [📥 PG-Dashboard.deb](https://github.com/anthropics/pg-dashboard/releases/latest) |

### Package Managers

```bash
# macOS (Homebrew) - coming soon
brew install --cask pg-dashboard

# Windows (Winget) - coming soon
winget install PGDashboard

# Linux (Flatpak) - coming soon
flatpak install pg-dashboard
```

---

## ⚡️ Quick Start

### 1. Add Your First Server

Launch PG Dashboard and click **"Add Server"**:

```yaml
Name:     Production DB
Host:     localhost
Port:     5432
Database: myapp
Username: postgres
Password: ********
```

### 2. Enable Query Statistics (Recommended)

For full query analysis, enable `pg_stat_statements`:

```sql
-- As superuser
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

Add to `postgresql.conf`:
```ini
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
```

Restart PostgreSQL and you're ready!

> 💡 **Note:** PG Dashboard works without `pg_stat_statements`, but query statistics will be limited.

### 3. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `g` then `s` | Go to Servers |
| `g` then `d` | Go to Dashboard |
| `g` then `m` | Go to Metrics |
| `g` then `c` | Go to Configuration |
| `g` then `i` | Go to Issues |
| `r` | Refresh data |
| `a` | Toggle auto-refresh |
| `?` | Show all shortcuts |

---

## 🔧 Tech Stack

<table>
<tr>
<td align="center" width="140">
<img src="https://tauri.app/logo.png" width="48" height="48" alt="Tauri"><br>
<b>Tauri 2.0</b><br>
<sub>Framework</sub>
</td>
<td align="center" width="140">
<img src="https://www.rust-lang.org/logos/rust-logo-512x512.png" width="48" height="48" alt="Rust"><br>
<b>Rust</b><br>
<sub>Backend</sub>
</td>
<td align="center" width="140">
<img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="48" height="48" alt="React"><br>
<b>React 18</b><br>
<sub>Frontend</sub>
</td>
<td align="center" width="140">
<img src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg" width="48" height="48" alt="TypeScript"><br>
<b>TypeScript</b><br>
<sub>Type Safety</sub>
</td>
<td align="center" width="140">
<img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg" width="48" height="48" alt="Tailwind"><br>
<b>Tailwind</b><br>
<sub>Styling</sub>
</td>
</tr>
</table>

### Why This Stack?

- **Tauri + Rust** = Native performance, tiny memory footprint, secure by default
- **React + TypeScript** = Modern, type-safe, component-based UI
- **Tailwind CSS** = Rapid styling with design system consistency
- **deadpool-postgres** = Efficient async connection pooling
- **Recharts** = Beautiful, responsive data visualizations

---

## 🛠️ Development

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) 1.70+
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Quick Setup

```bash
# Clone
git clone https://github.com/anthropics/pg-dashboard.git
cd pg-dashboard

# Install dependencies
npm install

# Run development server
npm run tauri dev

# Build for production
npm run tauri build
```

### Project Structure

```
pg-dashboard/
├── src/                      # React Frontend
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Design system (Badge, Button, etc.)
│   │   └── *.tsx            # Feature components
│   ├── contexts/            # React contexts (Server, Toast, Groups)
│   ├── hooks/               # Custom hooks (useServerData, useKeyboardShortcuts)
│   ├── lib/                 # Utilities (api.ts, export.ts)
│   ├── pages/               # Page components
│   └── types/               # TypeScript definitions
│
├── src-tauri/               # Rust Backend
│   ├── src/
│   │   ├── commands/        # Tauri IPC commands
│   │   │   ├── connection_commands.rs
│   │   │   ├── metrics_commands.rs
│   │   │   └── analyzer_commands.rs
│   │   ├── db/              # Database layer
│   │   │   ├── connection.rs   # Pool management
│   │   │   ├── queries.rs      # SQL queries
│   │   │   ├── analyzer.rs     # Issue detection
│   │   │   └── storage.rs      # Persistence
│   │   └── lib.rs           # Tauri setup
│   └── Cargo.toml
│
├── .github/workflows/       # CI/CD (builds for all platforms)
└── package.json
```

### Useful Commands

```bash
# Frontend only
npm run dev              # Start Vite dev server

# Full app
npm run tauri dev        # Development with hot-reload

# Build
npm run build            # Build frontend
npm run tauri build      # Build production app

# Rust
cargo check              # Type check
cargo fmt                # Format code
cargo clippy             # Lint
```

---

## 🗺️ Roadmap

### ✅ Version 1.0 (Current)

- [x] Real-time monitoring dashboard
- [x] Query analysis with EXPLAIN visualization
- [x] Configuration recommendations engine
- [x] Performance issue auto-detection
- [x] Server grouping (Production/Staging/Dev)
- [x] Export to CSV/JSON
- [x] Keyboard shortcuts
- [x] Cross-platform builds (Windows, macOS, Linux)
- [x] Secure credential storage (OS keychain)

### 🚧 Version 1.1 (In Progress)

- [ ] Alert system with customizable thresholds
- [ ] Metrics history with trend analysis
- [ ] Server comparison view
- [ ] Custom dashboard layouts
- [ ] Query bookmarks & favorites

### 🔮 Version 1.2 (Planned)

- [ ] Slow query log analysis
- [ ] AI-powered index recommendations
- [ ] VACUUM scheduling suggestions
- [ ] Multi-language support (i18n)
- [ ] Plugin/extension system
- [ ] Cloud sync for settings

### 💭 Ideas & Wishlist

- [ ] Connection via SSH tunnel
- [ ] Integration with Prometheus/Grafana
- [ ] Slack/Discord notifications
- [ ] Automated performance reports (PDF)
- [ ] pg_stat_kcache integration
- [ ] pg_wait_sampling support

---

## 🤝 Contributing

We love contributions! Whether it's:

- 🐛 Bug reports
- 💡 Feature requests
- 📖 Documentation improvements
- 🔧 Code contributions

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to your branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please read our [Contributing Guide](CONTRIBUTING.md) for details on code style and development workflow.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) — The framework that makes this possible
- [PostgreSQL](https://www.postgresql.org/) — The world's most advanced open source database
- [PGTune](https://pgtune.leopard.in.ua/) — Inspiration for configuration recommendations
- [Recharts](https://recharts.org/) — Beautiful React charts
- [Lucide](https://lucide.dev/) — Gorgeous icon set

---

## ⭐ Star History

<p align="center">
  <a href="https://star-history.com/#anthropics/pg-dashboard&Date">
    <img src="https://api.star-history.com/svg?repos=anthropics/pg-dashboard&type=Date" alt="Star History Chart">
  </a>
</p>

---

<p align="center">
  <b>Made with ❤️ for the PostgreSQL community</b>
</p>

<p align="center">
  <a href="https://github.com/anthropics/pg-dashboard/stargazers">
    <img src="https://img.shields.io/github/stars/anthropics/pg-dashboard?style=social" alt="GitHub stars">
  </a>
  &nbsp;&nbsp;
  <a href="https://twitter.com/intent/tweet?text=Check%20out%20PG%20Dashboard%20-%20a%20modern%20PostgreSQL%20monitoring%20tool!&url=https://github.com/anthropics/pg-dashboard">
    <img src="https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Fgithub.com%2Fanthropics%2Fpg-dashboard" alt="Tweet">
  </a>
</p>
