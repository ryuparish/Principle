# Principle - Interactive World Mindmap Application

A local-first, microservices-based mindmap application for organizing knowledge.

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start PostgreSQL databases
docker-compose up postgres-nodes postgres-edges postgres-media -d

# Run database migrations
npm run prisma:migrate

# Start all services
npm run dev:all
```

## Services

- **Client:** http://localhost:5173
- **API Gateway:** http://localhost:3000
- **Node Service:** http://localhost:3001
- **Edge Service:** http://localhost:3002
- **Media Service:** http://localhost:3003
- **AI Service:** http://localhost:3004

## Documentation

See [PRD.md](./PRD.md) for full product requirements.
See [Phase_0_Project_Setup.md](./Phase_0_Project_Setup.md) for setup instructions.

## Architecture

Principle uses a microservices architecture with:
- 5 backend services (API Gateway, Node, Edge, Media, AI)
- 1 React frontend client
- 3 PostgreSQL databases (one per core service)
- Local file storage for images

All data stays on your machine for privacy and offline capability.
