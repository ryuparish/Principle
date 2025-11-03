# Principle - Interactive World Mindmap Application

A local-first, microservices-based mindmap application for organizing knowledge and taking notes in an interactive mindmap format.

## Installation on Mac

### Prerequisites

Before installing Principle, ensure you have the following installed on your Mac:

1. **Node.js** (v18 or higher) and **npm** (v9 or higher)
   ```bash
   # Check if installed
   node --version
   npm --version

   # If not installed, download from:
   # https://nodejs.org/en/download/
   # Or install via Homebrew:
   brew install node
   ```

2. **Docker Desktop for Mac**
   ```bash
   # Check if installed
   docker --version
   docker-compose --version

   # If not installed, download from:
   # https://www.docker.com/products/docker-desktop
   # Or install via Homebrew:
   brew install --cask docker

   # After installation, start Docker Desktop from Applications
   ```

3. **Git** (usually pre-installed on Mac)
   ```bash
   # Check if installed
   git --version

   # If not installed:
   brew install git
   ```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Principle
   ```

   If you're copying from an existing installation, you can skip this step and just navigate to the Principle directory.

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

   This will install dependencies for all services (API Gateway, Node Service, Edge Service, Media Service, AI Service, Queue Service) and the client application.

3. **Start Docker containers**

   Make sure Docker Desktop is running, then start the PostgreSQL databases and Redis:
   ```bash
   docker-compose up -d
   ```

   This will start:
   - 3 PostgreSQL databases (for nodes, edges, and media)
   - Redis (for queue management)

4. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

   This sets up the database schema for all services.

5. **Start the application**
   ```bash
   npm run dev:all
   ```

   This will start all services and the client application.

6. **Open the application**

   Once all services are running, open your browser and navigate to:
   ```
   http://localhost:5173
   ```

### Stopping the Application

To stop all services:
```bash
# Press Ctrl+C in the terminal where dev:all is running
# Then kill any remaining processes:
npm run kill
```

To stop Docker containers:
```bash
npm run docker:down
```

### Restarting the Application

To restart everything after stopping:
```bash
# Start Docker (if not already running)
npm run docker:up

# Start all services
npm run dev:all
```

## Services & Ports

Once running, the following services will be available:

- **Client (Web App):** http://localhost:5173
- **API Gateway:** http://localhost:3000
- **Node Service:** http://localhost:3001
- **Edge Service:** http://localhost:3002
- **Media Service:** http://localhost:3003
- **AI Service:** http://localhost:3004
- **Queue Service:** http://localhost:3005

## Troubleshooting

**Problem: "Port already in use" errors**
```bash
# Kill existing processes on those ports
npm run kill
```

**Problem: Docker containers won't start**
```bash
# Make sure Docker Desktop is running
# Then restart containers
npm run docker:down
npm run docker:up
```

**Problem: Database connection errors**
```bash
# Reset databases (WARNING: This will delete all data)
npm run docker:reset
npm run prisma:migrate
```

**Problem: Module not found errors**
```bash
# Reinstall dependencies
npm run install:all
```

## Documentation

- [PRD.md](./PRD.md) - Full product requirements
- [Phase_0_Project_Setup.md](./Phase_0_Project_Setup.md) - Detailed setup instructions

## Architecture

Principle uses a microservices architecture with:
- 6 backend services (API Gateway, Node, Edge, Media, AI, Queue)
- 1 React frontend client
- 3 PostgreSQL databases (one per core service)
- Redis for queue management
- Local file storage for images

All data stays on your machine for privacy and offline capability.
