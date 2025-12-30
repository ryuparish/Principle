# Principle - Interactive World Concept Map Application

A local-first, microservices-based concept map application for organizing knowledge and taking notes in an interactive mindmap format.

> **🚀 Docker-Free Version**: This branch runs entirely with SQLite and in-memory queuing. No Docker, PostgreSQL, or Redis required!

## Prerequisites

**Required:**
- **Node.js** (v18 or higher) and **npm** (v9 or higher)
  ```bash
  # Check if installed
  node --version
  npm --version

  # If not installed, download from: https://nodejs.org/
  # Or install via Homebrew:
  brew install node
  ```

**Optional:**
- **Git** (for cloning the repository)
  ```bash
  # Check if installed
  git --version

  # If not installed:
  brew install git
  ```

---

## Quick Start

> 📚 **New to Principle?** Check out [GETTING_STARTED.md](./GETTING_STARTED.md) for a complete walkthrough including how to use Vim mode and all features!

### 1. Clone or Copy the Repository

```bash
# Option A: Clone from Git
git clone <repository-url>
cd Principle

# Option B: If copying from existing installation
cd Principle
```

### 2. Checkout Docker-Free Branch

```bash
git checkout docker-free
```

### 3. Install Dependencies

```bash
# ⚠️ IMPORTANT: Run this from the ROOT Principle directory
npm run install:all
```

This installs dependencies for all services (API Gateway, Node Service, Edge Service, Media Service, AI Service, Queue Service) and the client application, then automatically creates `.env` files from the `.env.example` templates.

**Installation takes:** ~2-3 minutes

**Why from root?** Principle uses npm workspaces to share dependencies efficiently. Running `npm install` in individual service folders will cause "Cannot find module" errors.

**Note:** If you need to recreate `.env` files later, run: `npm run setup`

### 4. Database Setup

No manual migration needed! TypeORM automatically creates the SQLite databases and schema on first startup.

The databases will be created at:
- `node-service/dev.db` - Stores concept maps, nodes, and edges
- `edge-service/dev.db` - Stores connections between nodes
- `media-service/dev.db` - Stores media metadata

### 5. Start the Application

```bash
npm run dev:all
```

This starts all 7 services concurrently. Wait until you see:
```
✅ API Gateway running on http://localhost:3000
✅ Node Service running on http://localhost:3001
 Edge Service running on http://localhost:3002
 Media Service running on http://localhost:3003
 AI Service running on http://localhost:3004
✅ Queue Service running on http://localhost:3005
📊 Queue: in-memory (no Redis needed)
VITE ready in XXXms
➜ Local: http://localhost:5173/
```

**Startup takes:** ~5-10 seconds

### 6. Open the Application

Navigate to: **http://localhost:5173**

---

## Stopping the Application

### Quick Stop

Press `Ctrl+C` in the terminal where `dev:all` is running.

### Force Kill (if needed)

If services don't stop cleanly:

```bash
npm run kill
```

This kills all processes on ports 3000-3005 and 5173.

---

## Restarting the Application

```bash
npm run restart
```

This is equivalent to:
```bash
npm run kill && npm run dev:all
```

---

## Services & Ports

Once running, these services are available:

| Service | URL | Purpose |
|---------|-----|---------|
| **Client (Web App)** | http://localhost:5173 | React UI with Vim mode |
| **API Gateway** | http://localhost:3000 | Routes requests to microservices |
| **Node Service** | http://localhost:3001 | Manages concept map nodes |
| **Edge Service** | http://localhost:3002 | Manages connections between nodes |
| **Media Service** | http://localhost:3003 | Handles image uploads |
| **AI Service** | http://localhost:3004 | Placeholder for AI features |
| **Queue Service** | http://localhost:3005 | Handles position update queue |

---

## Database Files

All data is stored in SQLite files (human-readable with SQLite tools):

```
node-service/dev.db        # Concept maps and nodes
edge-service/dev.db        # Edges/connections
media-service/dev.db       # Media metadata
```

**Backup:** Just copy these 3 `.db` files

**Reset:** Delete these files and restart services (they'll be recreated automatically)

---

## Project Structure

```
Principle/
├── api-gateway/          # Request router
├── node-service/         # Node CRUD + SQLite DB
├── edge-service/         # Edge CRUD + SQLite DB
├── media-service/        # Media handling + SQLite DB
├── ai-service/           # AI features (placeholder)
├── queue-service/        # Position update queue (in-memory)
├── client/               # React frontend with Vim mode
├── shared/               # Shared types (future)
├── package.json          # Root scripts
└── README.md            # This file
```

---

## Troubleshooting

### Problem: "Port already in use" errors

**Solution:**
```bash
npm run kill
```

This kills all processes on Principle's ports.

---

### Problem: "Module not found" errors (e.g., "Cannot find module 'better-queue'" or "@prisma/client")

**Cause:** This happens when:
- Dependencies weren't installed from the root directory
- You ran `npm install` in individual service folders instead of the root
- Fresh clone without running the full installation

**Solution:**
```bash
# IMPORTANT: Always run from the root Principle directory
cd /path/to/Principle
npm run install:all
```

**Why this works:** Principle uses npm workspaces, which hoists shared dependencies to the root `node_modules`. Individual service `npm install` commands won't install all required packages.

**Quick fix if you're already in a service directory:**
```bash
cd ..  # Go back to root
npm install  # Install workspace dependencies
```

---

### Problem: Database errors or corrupted data

**Solution (WARNING: Deletes all data):**
```bash
# Delete databases
rm node-service/dev.db edge-service/dev.db media-service/dev.db

# Restart services (databases will be recreated)
npm run restart
```

---

### Problem: Services won't start

**Check:**
1. Node.js version: `node --version` (should be v18+)
2. Port conflicts: `npm run kill`
3. Dependencies: `npm run install:all`
4. Logs: Look for errors in the terminal output

---

### Problem: Queue not processing updates

**Restart queue service:**
```bash
# Kill all services
npm run kill

# Restart
npm run dev:all
```

The queue is in-memory, so it clears on restart (this is intentional for development).

---

## Development Commands

```bash
# Install all dependencies
npm run install:all

# Start all services
npm run dev:all

# Stop all services
npm run kill

# Restart all services
npm run restart
```

### Testing Commands

```bash
# Run unit tests
cd client && npm test

# Run unit tests with UI
cd client && npm run test:ui

# Run tests with coverage
cd client && npm run test:coverage

# Run E2E tests
cd client && npm run test:e2e

# Run E2E tests with UI
cd client && npm run test:e2e:ui

# View E2E test report
cd client && npm run test:e2e:report
```

---

## Individual Service Commands

Start services individually for debugging:

```bash
# API Gateway
cd api-gateway && PORT=3000 npm run dev

# Node Service
cd node-service && PORT=3001 npm run dev

# Edge Service
cd edge-service && PORT=3002 npm run dev

# Media Service
cd media-service && PORT=3003 npm run dev

# AI Service
cd ai-service && PORT=3004 npm run dev

# Queue Service
cd queue-service && PORT=3005 npm run dev

# Client
cd client && npm run dev
```

---

## Keyboard Shortcuts

### Global Shortcuts (Always Available)

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Open search |
| `Ctrl+;` | Toggle Vim mode |
| `Escape` | Close search / Exit modes |

### Search Mode (When Search is Open)

| Shortcut | Action |
|----------|--------|
| `↑` / `↓` | Navigate search results |
| `Enter` | Select highlighted result |
| `Escape` | Close search |

### Vim Mode Shortcuts

See [GETTING_STARTED.md](./GETTING_STARTED.md) for complete Vim mode documentation including:
- Normal mode navigation (`h`, `j`, `k`, `l`)
- Insert mode (`i`, `a`, `o`)
- Visual mode (`v`)
- Edge mode (`e`)
- Edge Edit mode (`Shift+E`)
- Move mode (`m`)
- Command mode (`:`)

---

## Features

### ✅ Vim Mode
- Full Vim-style keyboard navigation
- Modes: Normal, Insert, Visual, Edge, Edge Edit, Move, Command
- Press `Ctrl+;` to toggle Vim mode

### ✅ Concept Mapping
- Create nodes with rich text content (TipTap editor)
- Create edges/connections between nodes
- Drag nodes to position them
- Move mode (`m`) for keyboard-based positioning

### ✅ Edge Management
- Edge mode (`e`) to create connections
- Edge Edit mode (`Shift+E`) to view/delete/navigate edges
- Navigate along edges with `h` (source) and `l` (target)

### ✅ Node Shapes (Compute-Ready)
- 12 different node shapes for architecture diagrams
- CSS-based shapes: Rectangle, Rounded Rectangle, Circle
- SVG-based shapes: Cylinder (DB), Hexagon (API), Diamond (Decision), Parallelogram (I/O), Cloud (External), Actor (User), Document, Queue, Storage
- Smart handle positioning per shape
- Shape picker integrated into node editor

### ✅ Search & Navigation
- Global search with `Ctrl+K` / `Cmd+K`
- Search across node titles, content, and tags
- Keyboard navigation with arrow keys
- Instant node focusing and zoom on selection

### ✅ Polish & UX (Phase 5)
- Toast notifications for user feedback
- Error boundary for crash recovery
- Loading indicators and skeleton screens
- Structured logging system with export
- Comprehensive keyboard shortcuts
- Auto-save functionality
- Undo/Redo system

### ✅ Testing Infrastructure
- Unit tests with Vitest
- Component tests with React Testing Library
- E2E tests with Playwright
- Coverage reporting
- CI/CD ready

### ✅ Offline-First
- All data stored locally in SQLite
- No external API calls
- Works without internet

---

## Architecture

**Stack:**
- **Frontend:** React 18 + ReactFlow + TipTap + Vite
- **Backend:** 6 Node.js/Express microservices
- **ORM:** TypeORM (type-safe database access)
- **Database:** 3 SQLite databases (file-based)
- **Queue:** better-queue (in-memory with retry logic)
- **State Management:** Zustand
- **Testing:** Vitest + React Testing Library + Playwright
- **Type Safety:** TypeScript everywhere

**Data Flow:**
1. Client → API Gateway → Microservice → SQLite
2. Position updates → Queue Service → Node Service (batched writes)
3. All services run as child processes (no Docker needed)

**Why Microservices?**
- Easy to understand (each service has one job)
- Can scale individual services later
- Good separation of concerns
- Mimics real-world architectures

---

## Documentation

**Getting Started:**
- [GETTING_STARTED.md](./GETTING_STARTED.md) - **Complete beginner's guide** with Vim mode tutorial
- [TESTING.md](./docs/TESTING.md) - **Testing guide** with unit and E2E test examples

**Technical Documentation:**
- [PRD.md](./PRD.md) - Full product requirements
- [Phase_0_Project_Setup.md](./Phase_0_Project_Setup.md) - Initial setup details
- [Phase_1_Core_Mindmap_Nodes.md](./Phase_1_Core_Mindmap_Nodes.md) - Node implementation
- [Phase_2_Node_Content_Editor.md](./Phase_2_Node_Content_Editor.md) - TipTap integration
- [Phase_3_Edge_Persistence.md](./Phase_3_Edge_Persistence.md) - Edge implementation
- [Phase_5_Polish_and_UX.md](./Phase_5_Polish_and_UX.md) - Polish, UX, and testing implementation

---

## Privacy & Security

✅ **100% Local** - All data stays on your machine
✅ **No External APIs** - No analytics, tracking, or telemetry
✅ **No Docker Required** - Pure Node.js, runs anywhere
✅ **Work-Safe** - Perfect for restricted environments

---

## License

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

See [LICENSE](./LICENSE) for the full license text.

---

## Contributing

Contributions are welcome! By contributing to Principle, you agree that your contributions will be licensed under the Apache License 2.0.

**How to Contribute:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Code of Conduct:**
- Be respectful and constructive
- Write clear commit messages
- Follow existing code style
- Add tests for new features

See [LICENSE](./LICENSE) for license details.

---

**Built with ❤️ for knowledge organization**
