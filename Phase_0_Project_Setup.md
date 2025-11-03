# Phase 0: Project Setup Guide
# Principle - Interactive World Mindmap Application

**Phase:** 0 - Project Setup
**Timeline:** Week 1, Days 1-2 (2 days)
**Status:** Not Started
**Date Created:** November 1, 2025

---

## Overview

This document provides detailed step-by-step instructions for setting up the Principle project infrastructure. By the end of Phase 0, you will have all services running locally, databases configured, and a "Hello World" client application.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure Setup](#project-structure-setup)
3. [Shared Types Package](#shared-types-package)
4. [Database Setup](#database-setup)
5. [API Gateway Service](#api-gateway-service)
6. [Node Service](#node-service)
7. [Edge Service](#edge-service)
8. [Media Service](#media-service)
9. [AI Service](#ai-service)
10. [Client Application](#client-application)
11. [Docker Compose Setup](#docker-compose-setup)
12. [Testing the Setup](#testing-the-setup)
13. [Success Criteria](#success-criteria)
14. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

Install the following before starting:

- **Node.js**: Version 18 or higher
  ```bash
  node --version  # Should be v18.x.x or higher
  ```

- **npm**: Version 9 or higher
  ```bash
  npm --version  # Should be 9.x.x or higher
  ```

- **PostgreSQL**: Version 15 or higher
  ```bash
  psql --version  # Should be 15.x or higher
  ```

- **Docker & Docker Compose**: Latest stable version
  ```bash
  docker --version
  docker-compose --version
  ```

- **Git**: For version control
  ```bash
  git --version
  ```

### System Requirements

- **RAM:** Minimum 4GB (8GB recommended)
- **Storage:** At least 10GB free space
- **OS:** macOS, Linux, or Windows with WSL2

---

## Project Structure Setup

### Step 1: Create Root Directory

```bash
# Navigate to your development folder
cd ~/Code  # Or your preferred location

# Create project directory
mkdir principle
cd principle

# Initialize git repository
git init

# Create main README
cat > README.md << 'EOF'
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

See [PRD.md](../Principle/PRD.md) for full product requirements.
EOF
```

### Step 2: Create Directory Structure

```bash
# Create service directories
mkdir -p api-gateway/src/{routes,services,middleware,config}
mkdir -p node-service/src/{routes,controllers,services,middleware,prisma}
mkdir -p edge-service/src/{routes,controllers,services,middleware,prisma}
mkdir -p media-service/src/{routes,controllers,services,middleware,prisma}
mkdir -p media-service/uploads
mkdir -p ai-service/src/{routes,controllers,services,middleware}
mkdir -p client/src/{components,hooks,store,api,types,styles}
mkdir -p client/public
mkdir -p shared/types

# Create placeholder files
touch api-gateway/src/index.ts
touch node-service/src/index.ts
touch edge-service/src/index.ts
touch media-service/src/index.ts
touch ai-service/src/index.ts
touch client/src/main.tsx
```

### Step 3: Create Root package.json

```bash
cat > package.json << 'EOF'
{
  "name": "principle",
  "version": "1.0.0",
  "description": "Interactive world mindmap application",
  "private": true,
  "workspaces": [
    "api-gateway",
    "node-service",
    "edge-service",
    "media-service",
    "ai-service",
    "client",
    "shared"
  ],
  "scripts": {
    "install:all": "npm install && npm run install:services && npm run install:client",
    "install:services": "cd api-gateway && npm install && cd ../node-service && npm install && cd ../edge-service && npm install && cd ../media-service && npm install && cd ../ai-service && npm install",
    "install:client": "cd client && npm install",
    "dev:all": "concurrently \"npm run dev:gateway\" \"npm run dev:node\" \"npm run dev:edge\" \"npm run dev:media\" \"npm run dev:ai\" \"npm run dev:client\"",
    "dev:gateway": "cd api-gateway && npm run dev",
    "dev:node": "cd node-service && npm run dev",
    "dev:edge": "cd edge-service && npm run dev",
    "dev:media": "cd media-service && npm run dev",
    "dev:ai": "cd ai-service && npm run dev",
    "dev:client": "cd client && npm run dev",
    "prisma:generate": "cd node-service && npx prisma generate && cd ../edge-service && npx prisma generate && cd ../media-service && npx prisma generate",
    "prisma:migrate": "cd node-service && npx prisma migrate dev && cd ../edge-service && npx prisma migrate dev && cd ../media-service && npx prisma migrate dev",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:reset": "docker-compose down -v && docker-compose up -d"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
EOF
```

### Step 4: Create .gitignore

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp/
.pnp.js

# Environment variables
.env
.env.local
.env.development
.env.production

# Database
*.db
*.sqlite

# Uploads
uploads/
!uploads/.gitkeep

# Build outputs
dist/
build/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Prisma
prisma/migrations/
*.db-journal

# Docker
docker-compose.override.yml
EOF
```

---

## Shared Types Package

### Step 1: Create shared/package.json

```bash
cat > shared/package.json << 'EOF'
{
  "name": "@principle/shared",
  "version": "1.0.0",
  "description": "Shared types and utilities",
  "main": "index.ts",
  "types": "index.ts",
  "scripts": {
    "build": "tsc"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
EOF
```

### Step 2: Create shared/tsconfig.json

```bash
cat > shared/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./types",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["types/**/*"],
  "exclude": ["node_modules"]
}
EOF
```

### Step 3: Create Shared Types

```bash
# Create mindmap types
cat > shared/types/mindmap.types.ts << 'EOF'
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Mindmap {
  id: string;
  name: string;
  description?: string;
  viewport: Viewport;
  createdAt: Date;
  updatedAt: Date;
}

export interface MindmapCreateInput {
  name: string;
  description?: string;
}

export interface MindmapUpdateInput {
  name?: string;
  description?: string;
  viewport?: Viewport;
}
EOF

# Create node types
cat > shared/types/node.types.ts << 'EOF'
export interface Position {
  x: number;
  y: number;
}

export interface NodeStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  width?: number;
  height?: number;
  fontSize?: number;
}

export interface RichTextContent {
  type: string;
  content?: any[];
  text?: string;
  marks?: any[];
}

export interface Node {
  id: string;
  mindmapId: string;
  title: string;
  content: RichTextContent;
  position: Position;
  style: NodeStyle;
  imageIds: string[];
  tags: string[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NodeCreateInput {
  mindmapId: string;
  title: string;
  content?: RichTextContent;
  position: Position;
  style?: NodeStyle;
}

export interface NodeUpdateInput {
  title?: string;
  content?: RichTextContent;
  position?: Position;
  style?: NodeStyle;
  imageIds?: string[];
  tags?: string[];
}
EOF

# Create edge types
cat > shared/types/edge.types.ts << 'EOF'
export interface EdgeStyle {
  color?: string;
  strokeWidth?: number;
  animated?: boolean;
  type?: 'smoothstep' | 'straight' | 'step';
}

export interface Edge {
  id: string;
  mindmapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  style: EdgeStyle;
  createdAt: Date;
}

export interface EdgeCreateInput {
  mindmapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  style?: EdgeStyle;
}
EOF

# Create media types
cat > shared/types/media.types.ts << 'EOF'
export interface Media {
  id: string;
  nodeId?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  url: string;
  thumbnailUrl?: string;
  createdAt: Date;
}

export interface MediaUploadInput {
  nodeId?: string;
  file: File | Buffer;
  originalName: string;
  mimeType: string;
}
EOF

# Create index file
cat > shared/types/index.ts << 'EOF'
export * from './mindmap.types';
export * from './node.types';
export * from './edge.types';
export * from './media.types';
EOF
```

---

## Database Setup

### Option 1: Using Docker (Recommended)

Create `docker-compose.yml` in the root:

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres-nodes:
    image: postgres:15
    container_name: principle-postgres-nodes
    environment:
      POSTGRES_DB: principle_nodes_db
      POSTGRES_USER: principle_user
      POSTGRES_PASSWORD: principle_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres-nodes-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U principle_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  postgres-edges:
    image: postgres:15
    container_name: principle-postgres-edges
    environment:
      POSTGRES_DB: principle_edges_db
      POSTGRES_USER: principle_user
      POSTGRES_PASSWORD: principle_pass
    ports:
      - "5433:5432"
    volumes:
      - postgres-edges-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U principle_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  postgres-media:
    image: postgres:15
    container_name: principle-postgres-media
    environment:
      POSTGRES_DB: principle_media_db
      POSTGRES_USER: principle_user
      POSTGRES_PASSWORD: principle_pass
    ports:
      - "5434:5432"
    volumes:
      - postgres-media-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U principle_user"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-nodes-data:
  postgres-edges-data:
  postgres-media-data:
EOF

# Start databases
docker-compose up -d
```

### Option 2: Local PostgreSQL Installation

If you prefer to use a local PostgreSQL installation:

```bash
# Create databases
psql -U postgres << 'EOF'
CREATE DATABASE principle_nodes_db;
CREATE DATABASE principle_edges_db;
CREATE DATABASE principle_media_db;
CREATE USER principle_user WITH PASSWORD 'principle_pass';
GRANT ALL PRIVILEGES ON DATABASE principle_nodes_db TO principle_user;
GRANT ALL PRIVILEGES ON DATABASE principle_edges_db TO principle_user;
GRANT ALL PRIVILEGES ON DATABASE principle_media_db TO principle_user;
EOF
```

---

## API Gateway Service

### Step 1: Create package.json

```bash
cat > api-gateway/package.json << 'EOF'
{
  "name": "api-gateway",
  "version": "1.0.0",
  "description": "API Gateway for Principle",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/morgan": "^1.9.9",
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3",
    "ts-node-dev": "^2.0.0"
  }
}
EOF
```

### Step 2: Create tsconfig.json

```bash
cat > api-gateway/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF
```

### Step 3: Create .env file

```bash
cat > api-gateway/.env << 'EOF'
PORT=3000
NODE_SERVICE_URL=http://localhost:3001
EDGE_SERVICE_URL=http://localhost:3002
MEDIA_SERVICE_URL=http://localhost:3003
AI_SERVICE_URL=http://localhost:3004
NODE_ENV=development
EOF
```

### Step 4: Create index.ts

```bash
cat > api-gateway/src/index.ts << 'EOF'
import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Principle API Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      nodes: '/api/nodes',
      edges: '/api/edges',
      media: '/api/media',
      mindmaps: '/api/mindmaps'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ API Gateway running on http://localhost:${PORT}`);
});
EOF
```

---

## Node Service

### Step 1: Create package.json

```bash
cat > node-service/package.json << 'EOF'
{
  "name": "node-service",
  "version": "1.0.0",
  "description": "Node management service",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "@prisma/client": "^5.7.1",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/morgan": "^1.9.9",
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3",
    "ts-node-dev": "^2.0.0",
    "prisma": "^5.7.1"
  }
}
EOF
```

### Step 2: Create tsconfig.json

```bash
cat > node-service/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF
```

### Step 3: Create .env file

```bash
cat > node-service/.env << 'EOF'
PORT=3001
DATABASE_URL="postgresql://principle_user:principle_pass@localhost:5432/principle_nodes_db?schema=public"
NODE_ENV=development
EOF
```

### Step 4: Create Prisma Schema

```bash
cat > node-service/src/prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Mindmap {
  id          String   @id @default(uuid())
  name        String
  description String?
  viewport    Json     @default("{\"x\": 0, \"y\": 0, \"zoom\": 1}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  nodes       Node[]

  @@map("mindmaps")
}

model Node {
  id         String   @id @default(uuid())
  mindmapId  String
  title      String
  content    Json     @default("{}")
  position   Json
  style      Json     @default("{}")
  imageIds   String[] @default([])
  tags       String[] @default([])
  isDeleted  Boolean  @default(false)
  deletedAt  DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  mindmap    Mindmap  @relation(fields: [mindmapId], references: [id], onDelete: Cascade)

  @@index([mindmapId])
  @@index([title])
  @@index([isDeleted])
  @@map("nodes")
}
EOF
```

### Step 5: Create index.ts

```bash
cat > node-service/src/index.ts << 'EOF'
import express, { Request, Response } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'node-service',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Principle Node Service',
    version: '1.0.0'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Node Service running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
EOF
```

---

## Edge Service

### Step 1: Create package.json

```bash
cat > edge-service/package.json << 'EOF'
{
  "name": "edge-service",
  "version": "1.0.0",
  "description": "Edge/connection management service",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "@prisma/client": "^5.7.1",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/morgan": "^1.9.9",
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3",
    "ts-node-dev": "^2.0.0",
    "prisma": "^5.7.1"
  }
}
EOF
```

### Step 2: Create tsconfig.json

```bash
cat > edge-service/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF
```

### Step 3: Create .env file

```bash
cat > edge-service/.env << 'EOF'
PORT=3002
DATABASE_URL="postgresql://principle_user:principle_pass@localhost:5433/principle_edges_db?schema=public"
NODE_ENV=development
EOF
```

### Step 4: Create Prisma Schema

```bash
cat > edge-service/src/prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Edge {
  id           String   @id @default(uuid())
  mindmapId    String
  sourceNodeId String
  targetNodeId String
  label        String?
  style        Json     @default("{}")
  createdAt    DateTime @default(now())

  @@unique([sourceNodeId, targetNodeId])
  @@index([mindmapId])
  @@index([sourceNodeId])
  @@index([targetNodeId])
  @@map("edges")
}
EOF
```

### Step 5: Create index.ts

```bash
cat > edge-service/src/index.ts << 'EOF'
import express, { Request, Response } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'edge-service',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Principle Edge Service',
    version: '1.0.0'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Edge Service running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
EOF
```

---

## Media Service

### Step 1: Create package.json

```bash
cat > media-service/package.json << 'EOF'
{
  "name": "media-service",
  "version": "1.0.0",
  "description": "Media/image management service",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "@prisma/client": "^5.7.1",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/morgan": "^1.9.9",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3",
    "ts-node-dev": "^2.0.0",
    "prisma": "^5.7.1"
  }
}
EOF
```

### Step 2: Create tsconfig.json

```bash
cat > media-service/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF
```

### Step 3: Create .env file

```bash
cat > media-service/.env << 'EOF'
PORT=3003
DATABASE_URL="postgresql://principle_user:principle_pass@localhost:5434/principle_media_db?schema=public"
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/png,image/jpeg,image/gif,image/webp
NODE_ENV=development
EOF
```

### Step 4: Create Prisma Schema

```bash
cat > media-service/src/prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Media {
  id           String   @id @default(uuid())
  nodeId       String?
  filename     String   @unique
  originalName String
  mimeType     String
  sizeBytes    Int
  width        Int?
  height       Int?
  url          String
  thumbnailUrl String?
  createdAt    DateTime @default(now())

  @@index([nodeId])
  @@index([filename])
  @@map("media")
}
EOF
```

### Step 5: Create index.ts

```bash
cat > media-service/src/index.ts << 'EOF'
import express, { Request, Response } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'media-service',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Principle Media Service',
    version: '1.0.0'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Media Service running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
EOF
```

### Step 6: Create uploads directory with .gitkeep

```bash
touch media-service/uploads/.gitkeep
```

---

## AI Service

### Step 1: Create package.json

```bash
cat > ai-service/package.json << 'EOF'
{
  "name": "ai-service",
  "version": "1.0.0",
  "description": "AI wrapper service (optional)",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "axios": "^1.6.2",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/morgan": "^1.9.9",
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3",
    "ts-node-dev": "^2.0.0"
  }
}
EOF
```

### Step 2: Create tsconfig.json

```bash
cat > ai-service/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF
```

### Step 3: Create .env file

```bash
cat > ai-service/.env << 'EOF'
PORT=3004
NODE_ENV=development
DEFAULT_AI_PROVIDER=openai
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OLLAMA_URL=http://localhost:11434
EOF
```

### Step 4: Create index.ts

```bash
cat > ai-service/src/index.ts << 'EOF'
import express, { Request, Response } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'ai-service',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Principle AI Service (Optional)',
    version: '1.0.0',
    note: 'AI features require external API keys'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ AI Service running on http://localhost:${PORT}`);
});
EOF
```

---

## Client Application

### Step 1: Create package.json

```bash
cat > client/package.json << 'EOF'
{
  "name": "principle-client",
  "version": "1.0.0",
  "description": "Principle client application",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "reactflow": "^11.10.3",
    "@tiptap/react": "^2.1.13",
    "@tiptap/starter-kit": "^2.1.13",
    "zustand": "^4.4.7",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
EOF
```

### Step 2: Create tsconfig.json

```bash
cat > client/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > client/tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF
```

### Step 3: Create vite.config.ts

```bash
cat > client/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
EOF
```

### Step 4: Create .env file

```bash
cat > client/.env << 'EOF'
VITE_API_URL=http://localhost:3000
EOF
```

### Step 5: Create Tailwind CSS config

```bash
cat > client/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

cat > client/postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
```

### Step 6: Create index.html

```bash
cat > client/index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Principle - Interactive Mindmap</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF
```

### Step 7: Create main.tsx and App.tsx

```bash
cat > client/src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

cat > client/src/App.tsx << 'EOF'
import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          Principle
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Interactive World Mindmap Application
        </p>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Phase 0: Setup Complete! ✅
          </h2>
          <p className="text-gray-600">
            All services are running. Ready to build the mindmap interface.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
EOF
```

### Step 8: Create styles/index.css

```bash
cat > client/src/styles/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOF
```

---

## Docker Compose Setup

The docker-compose.yml was already created in the Database Setup section. Here's a reminder of what it includes:

```bash
# Start all databases
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all databases
docker-compose down

# Reset databases (WARNING: deletes all data)
docker-compose down -v
```

---

## Testing the Setup

### Step 1: Install All Dependencies

```bash
# From the root directory
cd ~/Code/principle

# Install root dependencies
npm install

# Install dependencies for all services and client
npm run install:all
```

### Step 2: Start Databases

```bash
# Start PostgreSQL databases
docker-compose up -d

# Verify databases are running
docker-compose ps
```

### Step 3: Run Database Migrations

```bash
# Generate Prisma clients and run migrations
npm run prisma:generate
npm run prisma:migrate
```

### Step 4: Start All Services

Open 6 terminal windows/tabs:

**Terminal 1 - API Gateway:**
```bash
cd api-gateway
npm run dev
```

**Terminal 2 - Node Service:**
```bash
cd node-service
npm run dev
```

**Terminal 3 - Edge Service:**
```bash
cd edge-service
npm run dev
```

**Terminal 4 - Media Service:**
```bash
cd media-service
npm run dev
```

**Terminal 5 - AI Service:**
```bash
cd ai-service
npm run dev
```

**Terminal 6 - Client:**
```bash
cd client
npm run dev
```

**OR use the root script (requires concurrently):**
```bash
# From root directory
npm run dev:all
```

### Step 5: Test Each Service

Open your browser or use curl:

```bash
# API Gateway
curl http://localhost:3000/health

# Node Service
curl http://localhost:3001/health

# Edge Service
curl http://localhost:3002/health

# Media Service
curl http://localhost:3003/health

# AI Service
curl http://localhost:3004/health

# Client
# Open browser: http://localhost:5173
```

You should see:
- All health checks return `{"status":"healthy",...}`
- Client displays "Principle" welcome page
- No errors in any terminal

---

## Success Criteria

Phase 0 is complete when all of the following are true:

- [ ] **Project Structure Created**
  - All 7 directories exist (api-gateway, node-service, edge-service, media-service, ai-service, client, shared)
  - All package.json files created
  - All tsconfig.json files created

- [ ] **Dependencies Installed**
  - `npm install` runs successfully in root
  - All service dependencies installed
  - Client dependencies installed

- [ ] **Databases Running**
  - `docker-compose ps` shows 3 PostgreSQL containers running
  - All containers show "healthy" status
  - Can connect to all 3 databases

- [ ] **Database Schemas Created**
  - Prisma schemas exist for all 3 services
  - Migrations run successfully
  - Tables created in each database

- [ ] **Services Running**
  - API Gateway responds on port 3000
  - Node Service responds on port 3001
  - Edge Service responds on port 3002
  - Media Service responds on port 3003
  - AI Service responds on port 3004
  - All health endpoints return 200 OK

- [ ] **Client Running**
  - Client app starts on port 5173
  - Browser displays welcome page
  - No console errors
  - Tailwind CSS working

- [ ] **Root Scripts Working**
  - `npm run dev:all` starts all services
  - `npm run prisma:migrate` runs without errors
  - `npm run docker:up` starts databases

- [ ] **Documentation Complete**
  - README.md exists with quick start
  - .env files exist for all services
  - .gitignore properly configured

---

## Troubleshooting

### Database Connection Issues

**Problem:** Cannot connect to PostgreSQL

**Solutions:**
```bash
# Check if containers are running
docker-compose ps

# Check container logs
docker-compose logs postgres-nodes

# Restart containers
docker-compose restart

# Reset databases
docker-compose down -v && docker-compose up -d
```

### Port Already in Use

**Problem:** Error: Port XXXX already in use

**Solutions:**
```bash
# Find process using port
lsof -i :3000  # Replace with your port

# Kill process
kill -9 <PID>

# Or change port in .env file
```

### Prisma Migration Errors

**Problem:** Prisma migrate fails

**Solutions:**
```bash
# Reset database
cd node-service
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# Run migration again
npx prisma migrate dev
```

### TypeScript Errors

**Problem:** TypeScript compilation errors

**Solutions:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check tsconfig.json is correct
# Restart TypeScript server in your IDE
```

### Client Won't Start

**Problem:** Vite errors or blank page

**Solutions:**
```bash
# Clear Vite cache
rm -rf client/node_modules/.vite

# Reinstall dependencies
cd client
rm -rf node_modules package-lock.json
npm install

# Check browser console for errors
```

### Docker Issues

**Problem:** Docker commands fail

**Solutions:**
```bash
# Restart Docker daemon
# On macOS: Restart Docker Desktop

# Check Docker is running
docker ps

# Clean up Docker resources
docker system prune -a
```

---

## Next Steps

After completing Phase 0, you're ready for **Phase 1: Core Mindmap & Nodes**:

1. Implement Node CRUD endpoints
2. Build mindmap canvas with React Flow
3. Create basic node components
4. Connect client to API Gateway
5. Test node creation and persistence

See the main PRD for Phase 1 details.

---

## Checklist

Use this checklist to track your progress:

### Day 1 Morning
- [ ] Install prerequisites (Node, PostgreSQL, Docker)
- [ ] Create project structure
- [ ] Create shared types package
- [ ] Set up API Gateway
- [ ] Set up Node Service

### Day 1 Afternoon
- [ ] Set up Edge Service
- [ ] Set up Media Service
- [ ] Set up AI Service
- [ ] Create Docker Compose configuration
- [ ] Start databases

### Day 2 Morning
- [ ] Set up Client application
- [ ] Install all dependencies
- [ ] Run Prisma migrations
- [ ] Test database connections

### Day 2 Afternoon
- [ ] Start all services individually
- [ ] Test all health endpoints
- [ ] Test client loads in browser
- [ ] Set up root scripts
- [ ] Verify all success criteria
- [ ] Document any issues encountered

---

## Estimated Time

- **Project Structure Setup:** 1 hour
- **Service Configuration:** 3 hours
- **Database Setup:** 1 hour
- **Client Setup:** 2 hours
- **Testing & Debugging:** 2 hours
- **Documentation:** 1 hour

**Total:** ~10 hours (1.5 working days with breaks)

---

## Resources

- **Prisma Docs:** https://www.prisma.io/docs
- **Express Docs:** https://expressjs.com/
- **React Flow Docs:** https://reactflow.dev/
- **Vite Docs:** https://vitejs.dev/
- **Docker Docs:** https://docs.docker.com/
- **TypeScript Docs:** https://www.typescriptlang.org/docs/

---

**Document Status:** Ready for Implementation
**Created:** November 1, 2025
**Last Updated:** November 1, 2025

---

**END OF PHASE 0 SETUP GUIDE**
