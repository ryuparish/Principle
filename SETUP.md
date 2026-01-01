# Principle Setup Guide

## Fresh Installation (New Clone)

This guide helps you set up Principle on a fresh machine after cloning the repository.

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **SQLite3** (for database)

Check your versions:
```bash
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
```

---

## Quick Start (Recommended)

For a fresh clone, run this single command from the project root:

```bash
npm run install:all
```

This will:
1. Install root dependencies
2. Install all service dependencies
3. Install client dependencies
4. Run setup scripts

**Then start the application:**

```bash
npm run dev:all
```

---

## Manual Setup (If Quick Start Fails)

If `npm run install:all` doesn't work, follow these steps:

### Step 1: Install Root Dependencies

```bash
npm install
```

This installs workspace tooling (concurrently, etc.)

### Step 2: Install Service Dependencies

```bash
cd api-gateway && npm install && cd ..
cd node-service && npm install && cd ..
cd edge-service && npm install && cd ..
cd media-service && npm install && cd ..
cd ai-service && npm install && cd ..
cd queue-service && npm install && cd ..
```

Or use the script:
```bash
npm run install:services
```

### Step 3: Install Client Dependencies

```bash
cd client && npm install && cd ..
```

Or use the script:
```bash
npm run install:client
```

### Step 4: Build Services

```bash
cd api-gateway && npm run build && cd ..
cd node-service && npm run build && cd ..
cd edge-service && npm run build && cd ..
cd media-service && npm run build && cd ..
```

### Step 5: Setup Database

The database will be created automatically on first run, but you can verify:

```bash
ls -la node-service/dev.db
```

If it doesn't exist, it will be created when you start the node-service.

---

## Troubleshooting

### Error: "Failed to resolve import 'react-router-dom'"

**Cause:** Client dependencies not installed properly.

**Solution:**
```bash
cd client
rm -rf node_modules package-lock.json
npm install
cd ..
npm install  # Also install from root
```

### Error: "Cannot find module 'express-rate-limit'"

**Cause:** API Gateway dependencies not installed.

**Solution:**
```bash
cd api-gateway
npm install
npm run build
cd ..
```

### Error: "TypeORM connection failed"

**Cause:** Database schema missing or outdated.

**Solution:**
```bash
cd node-service
rm -f dev.db  # Delete old database
npm start     # Will create fresh database
```

Then run the database migrations (see Database Migrations section below).

### Error: "Port already in use"

**Cause:** Services still running from previous session.

**Solution:**
```bash
npm run kill  # Kill all running services
```

Or manually:
```bash
lsof -ti:3000 | xargs kill  # API Gateway
lsof -ti:3001 | xargs kill  # Node Service
lsof -ti:3002 | xargs kill  # Edge Service
lsof -ti:3003 | xargs kill  # Media Service
lsof -ti:3004 | xargs kill  # AI Service
lsof -ti:3005 | xargs kill  # Queue Service
lsof -ti:5173 | xargs kill  # Vite Dev Server
```

---

## Database Migrations

After a fresh clone, you need to add the sharing feature columns to the database:

```bash
cd node-service
sqlite3 dev.db << 'EOF'
-- Add sharing columns to mindmaps table
ALTER TABLE mindmaps ADD COLUMN visibility TEXT DEFAULT 'private';
ALTER TABLE mindmaps ADD COLUMN share_slug TEXT;
ALTER TABLE mindmaps ADD COLUMN share_token TEXT;
ALTER TABLE mindmaps ADD COLUMN shared_at DATETIME;
CREATE UNIQUE INDEX IF NOT EXISTS idx_share_slug ON mindmaps(share_slug);

-- Add shape column to nodes table
ALTER TABLE nodes ADD COLUMN shape TEXT DEFAULT 'rounded-rectangle';

-- Verify columns were added
PRAGMA table_info(mindmaps);
PRAGMA table_info(nodes);
EOF
```

**Note:** If tables don't exist yet, start the services first and they will be created automatically, then run the migrations.

---

## Verifying Installation

Run this script to check if everything is set up correctly:

```bash
./scripts/check-setup.sh
```

Or manually check:

### 1. Check Node Modules

```bash
# Root
ls node_modules | wc -l  # Should show packages

# Services
ls api-gateway/node_modules | wc -l
ls node-service/node_modules | wc -l
ls client/node_modules | wc -l
```

### 2. Check Built Files

```bash
ls api-gateway/dist/index.js
ls node-service/dist/index.js
ls edge-service/dist/index.js
ls media-service/dist/index.js
```

### 3. Test Services Health

Start services and check:

```bash
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Node Service
curl http://localhost:3002/health  # Edge Service
curl http://localhost:3003/health  # Media Service
```

---

## Running the Application

### Development Mode (All Services)

```bash
npm run dev:all
```

This starts:
- API Gateway (port 3000)
- Node Service (port 3001)
- Edge Service (port 3002)
- Media Service (port 3003)
- AI Service (port 3004)
- Queue Service (port 3005)
- Client Dev Server (port 5173)

### Individual Services

```bash
npm run dev:gateway  # API Gateway only
npm run dev:node     # Node Service only
npm run dev:client   # Client only
# etc.
```

### Production Build

```bash
# Build all services
cd api-gateway && npm run build && cd ..
cd node-service && npm run build && cd ..
cd edge-service && npm run build && cd ..
cd media-service && npm run build && cd ..

# Build client
cd client && npm run build && cd ..
```

---

## Common Issues on Fresh Clone

### 1. Workspace Dependencies Not Linking

**Symptom:** Import errors even after `npm install`

**Fix:**
```bash
rm -rf node_modules package-lock.json
rm -rf */node_modules */package-lock.json
npm install
npm run install:services
npm run install:client
```

### 2. TypeScript Compilation Errors

**Symptom:** `tsc` errors when building

**Fix:**
```bash
# Update TypeScript globally
npm install -g typescript@latest

# Rebuild services
npm run install:services
cd api-gateway && npm run build && cd ..
cd node-service && npm run build && cd ..
```

### 3. Missing Environment Variables

**Symptom:** Services can't connect to each other

**Fix:** Create `.env` files or use defaults (services default to localhost)

```bash
# api-gateway/.env (optional)
NODE_SERVICE_URL=http://localhost:3001
EDGE_SERVICE_URL=http://localhost:3002
MEDIA_SERVICE_URL=http://localhost:3003

# client/.env (optional)
VITE_API_URL=http://localhost:3000
```

---

## Development Workflow

1. **Start all services:**
   ```bash
   npm run dev:all
   ```

2. **Open the application:**
   - Client: http://localhost:5173
   - API Gateway: http://localhost:3000

3. **Make changes to code** - Services auto-reload

4. **Stop services:**
   ```bash
   Ctrl+C  # Or npm run kill
   ```

---

## Getting Help

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Run `npm run check-setup` (if script exists)
3. Check service logs in terminal
4. Open an issue on GitHub with error messages

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React)                        │
│                   Port: 5173 (dev)                       │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   API Gateway                            │
│                      Port: 3000                          │
└───┬─────────┬─────────┬─────────┬─────────┬────────────┘
    │         │         │         │         │
    ▼         ▼         ▼         ▼         ▼
┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ Node   │ │ Edge │ │Media │ │  AI  │ │Queue │
│Service │ │Service│ │Service│ │Service│ │Service│
│  3001  │ │ 3002 │ │ 3003 │ │ 3004 │ │ 3005 │
└────────┘ └──────┘ └──────┘ └──────┘ └──────┘
    │
    ▼
┌─────────────────┐
│   SQLite DB     │
│   (dev.db)      │
└─────────────────┘
```

---

**Last Updated:** December 31, 2025
