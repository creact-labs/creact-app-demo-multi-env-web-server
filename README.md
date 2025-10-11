# CReact Demo - Multi-Environment Web Server

![creact](https://i.postimg.cc/8P66GnT3/banner.jpg)

Multi env landing page CReact app

## Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** (comes with Node.js)

### Platform-Specific Requirements

#### Linux/macOS
- No additional requirements

#### Windows
- **PowerShell** or **Command Prompt**
- **Windows Terminal** (recommended for better experience)

## Installation

```bash
# Clone or navigate to the demo directory
cd examples/creact-demo

# Install dependencies
npm install
```

This will install:
- `@creact-labs/creact` - The CReact framework
- `http-server` - HTTP server for serving static content
- `better-sqlite3` - SQLite database for state persistence
- `cross-spawn` - Cross-platform process spawning
- `tree-kill` - Cross-platform process cleanup
- `cross-env` - Cross-platform environment variables
- `rimraf` - Cross-platform file deletion
- TypeScript and related tooling

All dependencies are chosen for cross-platform compatibility.

## Project Structure

```
src/
├── app.tsx                    # Entry point - provider configuration
├── components/                # React-like component structure
│   ├── index.ts              # Component exports
│   ├── App.tsx               # Root application component
│   ├── EnvironmentStack.tsx  # Environment configuration wrapper
│   └── EnvironmentWebServer.tsx  # Web server deployment component
├── contexts/                  # Context definitions
│   └── EnvironmentContext.ts # Environment configuration context
├── config/                    # Configuration files
│   └── environments.ts       # Environment definitions
├── providers/                 # Cloud and backend providers
│   ├── index.ts              # Provider exports
│   ├── WebServerProvider.ts  # HTTP server provider
│   └── MemoryBackendProvider.ts  # SQLite backend
├── utils/                     # Utility functions
│   └── htmlGenerator.ts      # HTML content generation
└── constructs.ts             # Infrastructure constructs
```

## Usage

### Development Mode (Hot Reload)

**Linux/macOS:**
```bash
npm run dev
```

**Windows (PowerShell):**
```powershell
npm run dev
```

**Windows (Command Prompt):**
```cmd
npm run dev
```

This starts CReact in development mode with:
- Automatic change detection
- Hot reload on file changes
- Auto-approval of changes (no manual confirmation)

### Other Commands

```bash
# Deploy infrastructure (one-time, with confirmation)
npm run deploy

# Show deployment plan (preview changes without deploying)
npm run plan

# Clean all state and deployed resources
npm run clean
```

### Debug Mode

To see detailed internal logs:

**Linux/macOS:**
```bash
npm run dev:log
```

**Windows (PowerShell):**
```powershell
$env:CREACT_LOG="*"; $env:CREACT_LOG_LEVEL="debug"; creact dev --entry src/app.tsx --auto-approve --verbose 2>&1 | Tee-Object debug.log
```

**Windows (Command Prompt):**
```cmd
set CREACT_LOG=* && set CREACT_LOG_LEVEL=debug && creact dev --entry src/app.tsx --auto-approve --verbose > debug.log 2>&1
```
## Accessing Deployed Servers

Once deployed, the servers are available at:
- Development: http://localhost:8080
- Staging: http://localhost:8081
- Production: http://localhost:8082

## Troubleshooting

### Port Already in Use

**Linux/macOS:**
```bash
# Find and kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

**Windows (PowerShell):**
```powershell
# Find and kill process on port 8080
Get-NetTCPConnection -LocalPort 8080 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

### Clean State and Start Fresh

```bash
npm run clean
npm run dev
```

### SQLite Issues on Windows

If you encounter SQLite build errors on Windows:
1. Install Windows Build Tools:
   ```powershell
   npm install --global windows-build-tools
   ```
2. Reinstall dependencies:
   ```bash
   npm install
   ```
