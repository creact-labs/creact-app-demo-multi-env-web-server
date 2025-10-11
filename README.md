# [CReact Demo - Multi-Environment Web Server](https://github.com/creact-labs/creact)

![creact](https://i.postimg.cc/8P66GnT3/banner.jpg)

Multi env landing page CReact app

## Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 

# Getting Started
```cmd
npm install
```

```cmd
npm run dev
```

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
netstat -ano | findstr :8080
# Note the PID from the output, then:
taskkill /PID <PID> /F
```

**Windows (Command Prompt):**
```cmd
# Find process on port 8080
netstat -ano | findstr :8080
# Note the PID from the output, then:
taskkill /PID <PID> /F
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