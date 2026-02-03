# Contributing to PG Dashboard

First off, thank you for considering contributing to PG Dashboard! It's people like you that make PG Dashboard such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct: be respectful, inclusive, and constructive.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Include your environment details:**
  - OS and version
  - PG Dashboard version
  - PostgreSQL version

### Suggesting Features

Feature suggestions are welcome! Please:

- **Use a clear and descriptive title**
- **Provide a detailed description of the proposed feature**
- **Explain why this feature would be useful**
- **Include mockups or examples if applicable**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies:** `npm install`
3. **Make your changes**
4. **Test your changes:** `npm run tauri dev`
5. **Ensure the build passes:** `npm run build`
6. **Format your code:**
   - Frontend: Prettier (auto-formatted on save)
   - Rust: `cargo fmt`
7. **Submit a pull request**

## Development Setup

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Tauri CLI prerequisites (see [Tauri docs](https://tauri.app/v1/guides/getting-started/prerequisites))

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/pg-dashboard.git
cd pg-dashboard

# Install dependencies
npm install

# Start development server
npm run tauri dev
```

### Project Structure

```
├── src/                  # React frontend
│   ├── components/       # UI components
│   ├── contexts/         # React contexts
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities
│   ├── pages/           # Page components
│   └── types/           # TypeScript types
├── src-tauri/           # Rust backend
│   ├── src/
│   │   ├── commands/    # Tauri commands
│   │   └── db/          # Database logic
│   └── Cargo.toml
└── package.json
```

## Coding Guidelines

### TypeScript/React

- Use functional components with hooks
- Use TypeScript strict mode
- Follow existing naming conventions
- Add types for all props and state
- Use `const` over `let` when possible

### Rust

- Run `cargo fmt` before committing
- Run `cargo clippy` and address warnings
- Follow Rust naming conventions
- Add documentation comments for public functions

### CSS

- Use Tailwind CSS utilities
- Follow the existing design system (CSS variables in `App.css`)
- Ensure responsive design (mobile-first)

### Commits

- Use clear, descriptive commit messages
- Reference issues when applicable (e.g., "Fix #123: ...")
- Keep commits focused and atomic

## Testing

Currently, we use manual testing. Automated tests are on the roadmap.

When submitting a PR:
1. Test the feature/fix manually
2. Verify it works on your platform
3. Check for console errors
4. Verify the build succeeds

## Questions?

Feel free to open an issue with the "question" label or reach out to the maintainers.

---

Thank you for contributing! 🎉
