# Phase 1: Core Mindmap & Nodes Implementation Guide
# Principle - Interactive World Mindmap Application

**Phase:** 1 - Core Mindmap & Nodes
**Timeline:** Week 1, Days 3-7 (5 days)
**Status:** Ready for Implementation
**Date Created:** November 2, 2025

---

## Overview

This document provides detailed step-by-step instructions for implementing Phase 1 of the Principle application. By the end of Phase 1, you will have a working mindmap application where users can create mindmaps, add nodes to a canvas, position them, and have all data persist to the database.

**What You'll Build:**
- Complete Node Service with CRUD operations for mindmaps and nodes
- API Gateway that routes requests to the Node Service
- React client with React Flow canvas
- Ability to create, update, delete, and position nodes visually
- Full data persistence across sessions

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Node Service Implementation](#node-service-implementation)
3. [API Gateway Routes](#api-gateway-routes)
4. [Client Setup with React Flow](#client-setup-with-react-flow)
5. [Testing the Complete Flow](#testing-the-complete-flow)
6. [Success Criteria](#success-criteria)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Phase 0 Must Be Complete

Before starting Phase 1, verify that Phase 0 is complete:

```bash
# Check all services are accessible
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Node Service
curl http://localhost:3002/health  # Edge Service
curl http://localhost:3003/health  # Media Service
curl http://localhost:3004/health  # AI Service

# Check databases are running
docker-compose ps

# Check client is running
curl http://localhost:5173
```

All health checks should return `{"status":"healthy",...}` and databases should show "healthy" status.

---

## Node Service Implementation

The Node Service is the core of Phase 1. We'll build routes, controllers, and services for managing mindmaps and nodes.

### Step 1: Review Existing Prisma Schema

The Prisma schema was created in Phase 0. Let's verify it's correct:

```bash
cat node-service/prisma/schema.prisma
```

You should see the `Mindmap` and `Node` models. This is already set up correctly.

### Step 2: Create Service Layer Files

Create the business logic layer:

```bash
# Create services directory if it doesn't exist
mkdir -p node-service/src/services

# Create mindmap service
cat > node-service/src/services/mindmap.service.ts << 'EOF'
import { PrismaClient, Mindmap } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateMindmapInput {
  name: string;
  description?: string;
}

export interface UpdateMindmapInput {
  name?: string;
  description?: string;
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export class MindmapService {
  async getAllMindmaps(): Promise<Mindmap[]> {
    return prisma.mindmap.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { nodes: true }
        }
      }
    });
  }

  async getMindmapById(id: string): Promise<Mindmap | null> {
    return prisma.mindmap.findUnique({
      where: { id },
      include: {
        nodes: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async createMindmap(data: CreateMindmapInput): Promise<Mindmap> {
    return prisma.mindmap.create({
      data: {
        name: data.name,
        description: data.description,
        viewport: { x: 0, y: 0, zoom: 1 }
      }
    });
  }

  async updateMindmap(id: string, data: UpdateMindmapInput): Promise<Mindmap> {
    return prisma.mindmap.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.viewport && { viewport: data.viewport })
      }
    });
  }

  async deleteMindmap(id: string): Promise<void> {
    // This will cascade delete all nodes due to Prisma schema
    await prisma.mindmap.delete({
      where: { id }
    });
  }
}

export const mindmapService = new MindmapService();
EOF

# Create node service
cat > node-service/src/services/node.service.ts << 'EOF'
import { PrismaClient, Node } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateNodeInput {
  mindmapId: string;
  title: string;
  content?: any;
  position: {
    x: number;
    y: number;
  };
  style?: any;
}

export interface UpdateNodeInput {
  title?: string;
  content?: any;
  position?: {
    x: number;
    y: number;
  };
  style?: any;
  imageIds?: string[];
  tags?: string[];
}

export class NodeService {
  async getNodesByMindmap(mindmapId: string): Promise<Node[]> {
    return prisma.node.findMany({
      where: {
        mindmapId,
        isDeleted: false
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getNodeById(id: string): Promise<Node | null> {
    return prisma.node.findUnique({
      where: { id }
    });
  }

  async createNode(data: CreateNodeInput): Promise<Node> {
    return prisma.node.create({
      data: {
        mindmapId: data.mindmapId,
        title: data.title,
        content: data.content || {},
        position: data.position,
        style: data.style || {}
      }
    });
  }

  async updateNode(id: string, data: UpdateNodeInput): Promise<Node> {
    return prisma.node.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.position !== undefined && { position: data.position }),
        ...(data.style !== undefined && { style: data.style }),
        ...(data.imageIds !== undefined && { imageIds: data.imageIds }),
        ...(data.tags !== undefined && { tags: data.tags })
      }
    });
  }

  async deleteNode(id: string): Promise<void> {
    // Soft delete
    await prisma.node.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });
  }

  async searchNodes(mindmapId: string, query: string): Promise<Node[]> {
    return prisma.node.findMany({
      where: {
        mindmapId,
        isDeleted: false,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          // Note: Searching in JSONB requires raw SQL for complex queries
          // For MVP, we'll just search titles
        ]
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });
  }
}

export const nodeService = new NodeService();
EOF
```

### Step 3: Create Controller Layer

Controllers handle HTTP requests and responses:

```bash
# Create controllers directory
mkdir -p node-service/src/controllers

# Create mindmap controller
cat > node-service/src/controllers/mindmap.controller.ts << 'EOF'
import { Request, Response } from 'express';
import { mindmapService } from '../services/mindmap.service';

export class MindmapController {
  async getAll(req: Request, res: Response) {
    try {
      const mindmaps = await mindmapService.getAllMindmaps();
      res.json({ mindmaps });
    } catch (error) {
      console.error('Error fetching mindmaps:', error);
      res.status(500).json({ error: 'Failed to fetch mindmaps' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const mindmap = await mindmapService.getMindmapById(id);

      if (!mindmap) {
        return res.status(404).json({ error: 'Mindmap not found' });
      }

      res.json(mindmap);
    } catch (error) {
      console.error('Error fetching mindmap:', error);
      res.status(500).json({ error: 'Failed to fetch mindmap' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, description } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const mindmap = await mindmapService.createMindmap({ name, description });
      res.status(201).json(mindmap);
    } catch (error) {
      console.error('Error creating mindmap:', error);
      res.status(500).json({ error: 'Failed to create mindmap' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, viewport } = req.body;

      const mindmap = await mindmapService.updateMindmap(id, {
        name,
        description,
        viewport
      });

      res.json(mindmap);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Mindmap not found' });
      }
      console.error('Error updating mindmap:', error);
      res.status(500).json({ error: 'Failed to update mindmap' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await mindmapService.deleteMindmap(id);
      res.json({ success: true, message: 'Mindmap deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Mindmap not found' });
      }
      console.error('Error deleting mindmap:', error);
      res.status(500).json({ error: 'Failed to delete mindmap' });
    }
  }
}

export const mindmapController = new MindmapController();
EOF

# Create node controller
cat > node-service/src/controllers/node.controller.ts << 'EOF'
import { Request, Response } from 'express';
import { nodeService } from '../services/node.service';

export class NodeController {
  async getByMindmap(req: Request, res: Response) {
    try {
      const { mindmapId } = req.query;

      if (!mindmapId || typeof mindmapId !== 'string') {
        return res.status(400).json({ error: 'mindmapId query parameter is required' });
      }

      const nodes = await nodeService.getNodesByMindmap(mindmapId);
      res.json({ nodes });
    } catch (error) {
      console.error('Error fetching nodes:', error);
      res.status(500).json({ error: 'Failed to fetch nodes' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const node = await nodeService.getNodeById(id);

      if (!node) {
        return res.status(404).json({ error: 'Node not found' });
      }

      res.json(node);
    } catch (error) {
      console.error('Error fetching node:', error);
      res.status(500).json({ error: 'Failed to fetch node' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { mindmapId, title, content, position, style } = req.body;

      // Validation
      if (!mindmapId) {
        return res.status(400).json({ error: 'mindmapId is required' });
      }
      if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: 'title is required' });
      }
      if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
        return res.status(400).json({ error: 'position with x and y coordinates is required' });
      }

      const node = await nodeService.createNode({
        mindmapId,
        title,
        content,
        position,
        style
      });

      res.status(201).json(node);
    } catch (error) {
      console.error('Error creating node:', error);
      res.status(500).json({ error: 'Failed to create node' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, content, position, style, imageIds, tags } = req.body;

      const node = await nodeService.updateNode(id, {
        title,
        content,
        position,
        style,
        imageIds,
        tags
      });

      res.json(node);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Node not found' });
      }
      console.error('Error updating node:', error);
      res.status(500).json({ error: 'Failed to update node' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await nodeService.deleteNode(id);
      res.json({ success: true, message: 'Node deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Node not found' });
      }
      console.error('Error deleting node:', error);
      res.status(500).json({ error: 'Failed to delete node' });
    }
  }

  async search(req: Request, res: Response) {
    try {
      const { mindmapId, q } = req.query;

      if (!mindmapId || typeof mindmapId !== 'string') {
        return res.status(400).json({ error: 'mindmapId query parameter is required' });
      }
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'q (query) parameter is required' });
      }

      const nodes = await nodeService.searchNodes(mindmapId, q);
      res.json({ results: nodes });
    } catch (error) {
      console.error('Error searching nodes:', error);
      res.status(500).json({ error: 'Failed to search nodes' });
    }
  }
}

export const nodeController = new NodeController();
EOF
```

### Step 4: Create Routes

Now wire up the controllers to Express routes:

```bash
# Create routes directory
mkdir -p node-service/src/routes

# Create mindmap routes
cat > node-service/src/routes/mindmap.routes.ts << 'EOF'
import { Router } from 'express';
import { mindmapController } from '../controllers/mindmap.controller';

const router = Router();

router.get('/', (req, res) => mindmapController.getAll(req, res));
router.get('/:id', (req, res) => mindmapController.getById(req, res));
router.post('/', (req, res) => mindmapController.create(req, res));
router.patch('/:id', (req, res) => mindmapController.update(req, res));
router.delete('/:id', (req, res) => mindmapController.delete(req, res));

export default router;
EOF

# Create node routes
cat > node-service/src/routes/node.routes.ts << 'EOF'
import { Router } from 'express';
import { nodeController } from '../controllers/node.controller';

const router = Router();

router.get('/', (req, res) => nodeController.getByMindmap(req, res));
router.get('/search', (req, res) => nodeController.search(req, res));
router.get('/:id', (req, res) => nodeController.getById(req, res));
router.post('/', (req, res) => nodeController.create(req, res));
router.patch('/:id', (req, res) => nodeController.update(req, res));
router.delete('/:id', (req, res) => nodeController.delete(req, res));

export default router;
EOF
```

### Step 5: Update Node Service index.ts

Update the main file to use the new routes:

```bash
cat > node-service/src/index.ts << 'EOF'
import express, { Request, Response } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import mindmapRoutes from './routes/mindmap.routes';
import nodeRoutes from './routes/node.routes';

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
    version: '1.0.0',
    endpoints: {
      mindmaps: '/mindmaps',
      nodes: '/nodes'
    }
  });
});

// API Routes
app.use('/mindmaps', mindmapRoutes);
app.use('/nodes', nodeRoutes);

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

### Step 6: Rebuild and Test Node Service

```bash
# Navigate to node-service
cd node-service

# Rebuild TypeScript
npm run build

# Restart the service (if running in background, kill and restart)
# Or just start it
PORT=3001 npm start
```

In another terminal, test the endpoints:

```bash
# Test health
curl http://localhost:3001/health

# Create a mindmap
curl -X POST http://localhost:3001/mindmaps \
  -H "Content-Type: application/json" \
  -d '{"name":"My First Mindmap","description":"Testing Phase 1"}'

# Save the returned ID, then get all mindmaps
curl http://localhost:3001/mindmaps

# Create a node (replace MINDMAP_ID with actual ID from above)
curl -X POST http://localhost:3001/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "mindmapId":"MINDMAP_ID",
    "title":"Node 1",
    "position":{"x":100,"y":100}
  }'

# Get nodes for mindmap
curl "http://localhost:3001/nodes?mindmapId=MINDMAP_ID"
```

You should see successful responses with created mindmaps and nodes.

---

## API Gateway Routes

Now we'll add routes in the API Gateway to proxy requests to the Node Service.

### Step 1: Create Service Configuration

```bash
cat > api-gateway/src/config/services.config.ts << 'EOF'
export const services = {
  nodeService: process.env.NODE_SERVICE_URL || 'http://localhost:3001',
  edgeService: process.env.EDGE_SERVICE_URL || 'http://localhost:3002',
  mediaService: process.env.MEDIA_SERVICE_URL || 'http://localhost:3003',
  aiService: process.env.AI_SERVICE_URL || 'http://localhost:3004'
};
EOF
```

### Step 2: Create Mindmap Routes in Gateway

```bash
mkdir -p api-gateway/src/routes

cat > api-gateway/src/routes/mindmap.routes.ts << 'EOF'
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { services } from '../config/services.config';

const router = Router();

// Get all mindmaps
router.get('/', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${services.nodeService}/mindmaps`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching mindmaps:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch mindmaps'
    });
  }
});

// Get mindmap by ID (with nodes)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${services.nodeService}/mindmaps/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching mindmap:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch mindmap'
    });
  }
});

// Create mindmap
router.post('/', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${services.nodeService}/mindmaps`, req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('Error creating mindmap:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to create mindmap'
    });
  }
});

// Update mindmap
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.patch(`${services.nodeService}/mindmaps/${id}`, req.body);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error updating mindmap:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to update mindmap'
    });
  }
});

// Delete mindmap
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.delete(`${services.nodeService}/mindmaps/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error deleting mindmap:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to delete mindmap'
    });
  }
});

export default router;
EOF
```

### Step 3: Create Node Routes in Gateway

```bash
cat > api-gateway/src/routes/node.routes.ts << 'EOF'
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { services } from '../config/services.config';

const router = Router();

// Get nodes by mindmap
router.get('/', async (req: Request, res: Response) => {
  try {
    const { mindmapId } = req.query;
    const response = await axios.get(`${services.nodeService}/nodes`, {
      params: { mindmapId }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching nodes:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch nodes'
    });
  }
});

// Search nodes
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { mindmapId, q } = req.query;
    const response = await axios.get(`${services.nodeService}/nodes/search`, {
      params: { mindmapId, q }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error searching nodes:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to search nodes'
    });
  }
});

// Get node by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${services.nodeService}/nodes/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching node:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch node'
    });
  }
});

// Create node
router.post('/', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${services.nodeService}/nodes`, req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('Error creating node:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to create node'
    });
  }
});

// Update node
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.patch(`${services.nodeService}/nodes/${id}`, req.body);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error updating node:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to update node'
    });
  }
});

// Delete node
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.delete(`${services.nodeService}/nodes/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error deleting node:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to delete node'
    });
  }
});

export default router;
EOF
```

### Step 4: Update API Gateway index.ts

```bash
cat > api-gateway/src/index.ts << 'EOF'
import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mindmapRoutes from './routes/mindmap.routes';
import nodeRoutes from './routes/node.routes';

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
      mindmaps: '/api/mindmaps',
      nodes: '/api/nodes'
    }
  });
});

// API Routes
app.use('/api/mindmaps', mindmapRoutes);
app.use('/api/nodes', nodeRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ API Gateway running on http://localhost:${PORT}`);
});
EOF
```

### Step 5: Rebuild and Test API Gateway

```bash
cd api-gateway
npm run build
PORT=3000 npm start
```

Test the gateway:

```bash
# Test via gateway
curl http://localhost:3000/api/mindmaps

# Create mindmap via gateway
curl -X POST http://localhost:3000/api/mindmaps \
  -H "Content-Type: application/json" \
  -d '{"name":"Gateway Test","description":"Testing via API Gateway"}'

# Create node via gateway
curl -X POST http://localhost:3000/api/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "mindmapId":"MINDMAP_ID",
    "title":"Gateway Node",
    "position":{"x":200,"y":200}
  }'
```

---

## Client Setup with React Flow

Now we'll build the React client with a visual canvas using React Flow.

### Step 1: Install React Flow and Zustand

```bash
cd client
npm install reactflow zustand
```

### Step 2: Create Type Definitions

```bash
mkdir -p src/types

cat > src/types/index.ts << 'EOF'
export interface Position {
  x: number;
  y: number;
}

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
  createdAt: string;
  updatedAt: string;
  nodes?: MindmapNode[];
}

export interface MindmapNode {
  id: string;
  mindmapId: string;
  title: string;
  content: any;
  position: Position;
  style: any;
  imageIds: string[];
  tags: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMindmapInput {
  name: string;
  description?: string;
}

export interface CreateNodeInput {
  mindmapId: string;
  title: string;
  position: Position;
  content?: any;
  style?: any;
}

export interface UpdateNodeInput {
  title?: string;
  content?: any;
  position?: Position;
  style?: any;
}
EOF
```

### Step 3: Create API Client

```bash
mkdir -p src/api

cat > src/api/client.ts << 'EOF'
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
EOF

cat > src/api/mindmap.api.ts << 'EOF'
import { apiClient } from './client';
import { Mindmap, CreateMindmapInput } from '../types';

export const mindmapApi = {
  getAll: async (): Promise<Mindmap[]> => {
    const response = await apiClient.get('/mindmaps');
    return response.data.mindmaps;
  },

  getById: async (id: string): Promise<Mindmap> => {
    const response = await apiClient.get(`/mindmaps/${id}`);
    return response.data;
  },

  create: async (data: CreateMindmapInput): Promise<Mindmap> => {
    const response = await apiClient.post('/mindmaps', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Mindmap>): Promise<Mindmap> => {
    const response = await apiClient.patch(`/mindmaps/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/mindmaps/${id}`);
  }
};
EOF

cat > src/api/node.api.ts << 'EOF'
import { apiClient } from './client';
import { MindmapNode, CreateNodeInput, UpdateNodeInput } from '../types';

export const nodeApi = {
  getByMindmap: async (mindmapId: string): Promise<MindmapNode[]> => {
    const response = await apiClient.get('/nodes', {
      params: { mindmapId }
    });
    return response.data.nodes;
  },

  getById: async (id: string): Promise<MindmapNode> => {
    const response = await apiClient.get(`/nodes/${id}`);
    return response.data;
  },

  create: async (data: CreateNodeInput): Promise<MindmapNode> => {
    const response = await apiClient.post('/nodes', data);
    return response.data;
  },

  update: async (id: string, data: UpdateNodeInput): Promise<MindmapNode> => {
    const response = await apiClient.patch(`/nodes/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/nodes/${id}`);
  },

  search: async (mindmapId: string, query: string): Promise<MindmapNode[]> => {
    const response = await apiClient.get('/nodes/search', {
      params: { mindmapId, q: query }
    });
    return response.data.results;
  }
};
EOF
```

### Step 4: Create Zustand Store

```bash
mkdir -p src/store

cat > src/store/mindmapStore.ts << 'EOF'
import { create } from 'zustand';
import { Mindmap, MindmapNode } from '../types';
import { mindmapApi } from '../api/mindmap.api';
import { nodeApi } from '../api/node.api';

interface MindmapStore {
  // State
  mindmaps: Mindmap[];
  currentMindmap: Mindmap | null;
  nodes: MindmapNode[];
  loading: boolean;
  error: string | null;

  // Actions
  loadMindmaps: () => Promise<void>;
  loadMindmap: (id: string) => Promise<void>;
  createMindmap: (name: string, description?: string) => Promise<Mindmap>;
  updateMindmap: (id: string, data: Partial<Mindmap>) => Promise<void>;
  deleteMindmap: (id: string) => Promise<void>;

  createNode: (title: string, position: { x: number; y: number }) => Promise<MindmapNode>;
  updateNode: (id: string, data: Partial<MindmapNode>) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;

  setCurrentMindmap: (mindmap: Mindmap | null) => void;
  clearError: () => void;
}

export const useMindmapStore = create<MindmapStore>((set, get) => ({
  mindmaps: [],
  currentMindmap: null,
  nodes: [],
  loading: false,
  error: null,

  loadMindmaps: async () => {
    set({ loading: true, error: null });
    try {
      const mindmaps = await mindmapApi.getAll();
      set({ mindmaps, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  loadMindmap: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const mindmap = await mindmapApi.getById(id);
      set({
        currentMindmap: mindmap,
        nodes: mindmap.nodes || [],
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createMindmap: async (name: string, description?: string) => {
    set({ loading: true, error: null });
    try {
      const mindmap = await mindmapApi.create({ name, description });
      set((state) => ({
        mindmaps: [...state.mindmaps, mindmap],
        currentMindmap: mindmap,
        loading: false
      }));
      return mindmap;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateMindmap: async (id: string, data: Partial<Mindmap>) => {
    try {
      const updated = await mindmapApi.update(id, data);
      set((state) => ({
        currentMindmap: state.currentMindmap?.id === id ? updated : state.currentMindmap,
        mindmaps: state.mindmaps.map((m) => (m.id === id ? updated : m))
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteMindmap: async (id: string) => {
    try {
      await mindmapApi.delete(id);
      set((state) => ({
        mindmaps: state.mindmaps.filter((m) => m.id !== id),
        currentMindmap: state.currentMindmap?.id === id ? null : state.currentMindmap,
        nodes: state.currentMindmap?.id === id ? [] : state.nodes
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  createNode: async (title: string, position: { x: number; y: number }) => {
    const { currentMindmap } = get();
    if (!currentMindmap) {
      throw new Error('No mindmap selected');
    }

    try {
      const node = await nodeApi.create({
        mindmapId: currentMindmap.id,
        title,
        position
      });
      set((state) => ({
        nodes: [...state.nodes, node]
      }));
      return node;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateNode: async (id: string, data: Partial<MindmapNode>) => {
    try {
      const updated = await nodeApi.update(id, data);
      set((state) => ({
        nodes: state.nodes.map((n) => (n.id === id ? updated : n))
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteNode: async (id: string) => {
    try {
      await nodeApi.delete(id);
      set((state) => ({
        nodes: state.nodes.filter((n) => n.id !== id)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setCurrentMindmap: (mindmap: Mindmap | null) => {
    set({ currentMindmap: mindmap, nodes: mindmap?.nodes || [] });
  },

  clearError: () => set({ error: null })
}));
EOF
```

### Step 5: Create React Flow Canvas Component

```bash
mkdir -p src/components/Canvas

cat > src/components/Canvas/MindMapCanvas.tsx << 'EOF'
import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeChange,
  applyNodeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useMindmapStore } from '../../store/mindmapStore';
import CustomNode from '../Node/CustomNode';

const nodeTypes = {
  custom: CustomNode,
};

interface MindMapCanvasProps {
  mindmapId: string;
}

const MindMapCanvas: React.FC<MindMapCanvasProps> = ({ mindmapId }) => {
  const { nodes: storeNodes, loadMindmap, createNode, updateNode } = useMindmapStore();
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  // Load mindmap data
  useEffect(() => {
    loadMindmap(mindmapId);
  }, [mindmapId]);

  // Convert store nodes to React Flow nodes
  useEffect(() => {
    const reactFlowNodes: Node[] = storeNodes.map((node) => ({
      id: node.id,
      type: 'custom',
      position: node.position,
      data: {
        label: node.title,
        node: node
      }
    }));
    setNodes(reactFlowNodes);
  }, [storeNodes]);

  // Handle node changes (drag, select, etc.)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));

      // Update position in database when dragging stops
      changes.forEach((change) => {
        if (change.type === 'position' && change.dragging === false && change.position) {
          updateNode(change.id, { position: change.position });
        }
      });
    },
    [updateNode]
  );

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyNodeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  // Handle canvas click to create new node
  const onPaneClick = useCallback(
    async (event: React.MouseEvent) => {
      if ((event.target as HTMLElement).classList.contains('react-flow__pane')) {
        const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const position = {
          x: event.clientX - bounds.left - 150, // Center the node
          y: event.clientY - bounds.top - 50
        };

        try {
          await createNode('New Node', position);
        } catch (error) {
          console.error('Failed to create node:', error);
        }
      }
    },
    [createNode]
  );

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default MindMapCanvas;
EOF
```

### Step 6: Create Custom Node Component

```bash
mkdir -p src/components/Node

cat > src/components/Node/CustomNode.tsx << 'EOF'
import React from 'react';
import { Handle, Position } from 'reactflow';

interface CustomNodeProps {
  data: {
    label: string;
    node: any;
  };
  isConnectable: boolean;
}

const CustomNode: React.FC<CustomNodeProps> = ({ data, isConnectable }) => {
  return (
    <div
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        background: '#fff',
        border: '2px solid #1a192b',
        minWidth: '150px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
        {data.label}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
    </div>
  );
};

export default CustomNode;
EOF
```

### Step 7: Create Mindmap Selector Component

```bash
mkdir -p src/components/Mindmap

cat > src/components/Mindmap/MindmapSelector.tsx << 'EOF'
import React, { useEffect, useState } from 'react';
import { useMindmapStore } from '../../store/mindmapStore';

interface MindmapSelectorProps {
  onSelect: (mindmapId: string) => void;
}

const MindmapSelector: React.FC<MindmapSelectorProps> = ({ onSelect }) => {
  const { mindmaps, loadMindmaps, createMindmap } = useMindmapStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadMindmaps();
  }, []);

  const handleCreate = async () => {
    if (newName.trim()) {
      const mindmap = await createMindmap(newName.trim());
      setNewName('');
      setShowCreate(false);
      onSelect(mindmap.id);
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Mindmaps</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + New Mindmap
          </button>
        </div>

        {showCreate && (
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Mindmap name..."
              className="w-full px-3 py-2 border rounded mb-2"
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mindmaps.map((mindmap) => (
            <div
              key={mindmap.id}
              onClick={() => onSelect(mindmap.id)}
              className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold mb-2">{mindmap.name}</h3>
              {mindmap.description && (
                <p className="text-gray-600 text-sm mb-2">{mindmap.description}</p>
              )}
              <p className="text-gray-400 text-xs">
                Updated: {new Date(mindmap.updatedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        {mindmaps.length === 0 && !showCreate && (
          <div className="text-center text-gray-500 mt-12">
            <p className="text-lg">No mindmaps yet. Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MindmapSelector;
EOF
```

### Step 8: Update App.tsx

```bash
cat > src/App.tsx << 'EOF'
import React, { useState } from 'react';
import MindmapSelector from './components/Mindmap/MindmapSelector';
import MindMapCanvas from './components/Canvas/MindMapCanvas';

function App() {
  const [selectedMindmapId, setSelectedMindmapId] = useState<string | null>(null);

  if (!selectedMindmapId) {
    return <MindmapSelector onSelect={setSelectedMindmapId} />;
  }

  return (
    <div className="w-full h-screen relative">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setSelectedMindmapId(null)}
          className="px-4 py-2 bg-white border border-gray-300 rounded shadow hover:bg-gray-50"
        >
          ← Back to Mindmaps
        </button>
      </div>
      <MindMapCanvas mindmapId={selectedMindmapId} />
    </div>
  );
}

export default App;
EOF
```

### Step 9: Rebuild and Run Client

```bash
cd client
npm run dev
```

The client should now be running on http://localhost:5174 (or 5173).

---

## Testing the Complete Flow

Now let's test the entire Phase 1 implementation:

### Test 1: Create a Mindmap

1. Open browser to http://localhost:5174
2. Click "New Mindmap"
3. Enter "Test Mindmap" and click Create
4. You should see the canvas

### Test 2: Create Nodes

1. Click anywhere on the canvas
2. A new node should appear
3. Create 10 nodes by clicking different positions
4. Each node should appear immediately

### Test 3: Drag Nodes

1. Click and drag a node
2. The node should move smoothly
3. Release - the position should be saved

### Test 4: Test Persistence

1. Refresh the browser (Cmd/Ctrl + R)
2. Go back to mindmap selector and open the same mindmap
3. All nodes should still be there at their saved positions

### Test 5: Pan and Zoom

1. Hold Shift + drag to pan the canvas
2. Use mouse wheel to zoom in/out
3. Use controls in bottom-left to zoom

### Test 6: Test via API

```bash
# Get all mindmaps
curl http://localhost:3000/api/mindmaps

# Get nodes for a mindmap
curl "http://localhost:3000/api/nodes?mindmapId=YOUR_MINDMAP_ID"

# Create a node directly
curl -X POST http://localhost:3000/api/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "mindmapId":"YOUR_MINDMAP_ID",
    "title":"API Created Node",
    "position":{"x":500,"y":300}
  }'
```

---

## Success Criteria

Phase 1 is complete when ALL of the following are true:

### Functional Criteria

- [ ] **Can create mindmaps**
  - Create mindmap via UI
  - Mindmap appears in list
  - Can open mindmap

- [ ] **Can create nodes**
  - Click canvas to create node
  - Node appears immediately
  - Node has unique ID

- [ ] **Can position nodes**
  - Drag nodes to new positions
  - Position updates smoothly
  - Position persists to database

- [ ] **Can update nodes**
  - Node data can be modified
  - Changes save to database
  - UI updates reflect changes

- [ ] **Can delete nodes**
  - Delete node functionality works
  - Node removed from canvas
  - Soft delete in database

- [ ] **Data persists**
  - Refresh browser - data remains
  - Close and reopen - data remains
  - All changes saved automatically

### UI/UX Criteria

- [ ] **Canvas works**
  - Infinite canvas
  - Smooth pan/zoom
  - Minimap shows nodes
  - Background grid visible

- [ ] **Nodes are draggable**
  - Click and drag works
  - No lag during drag
  - Snap to grid (optional)

- [ ] **Performance**
  - Create 10+ nodes without lag
  - Smooth 60 FPS interactions
  - Fast load times

### API Criteria

- [ ] **Gateway routes work**
  - `/api/mindmaps` endpoints functional
  - `/api/nodes` endpoints functional
  - Error handling works

- [ ] **Service communication**
  - Gateway → Node Service works
  - Proper error propagation
  - CORS configured correctly

### Database Criteria

- [ ] **Schema is correct**
  - Mindmaps table has data
  - Nodes table has data
  - Foreign keys work

- [ ] **Data integrity**
  - No duplicate IDs
  - Positions stored correctly
  - Timestamps accurate

---

## Troubleshooting

### Issue 1: Nodes don't appear on canvas

**Symptoms:** Canvas is blank after clicking

**Solutions:**
```bash
# Check if nodes are being created
curl "http://localhost:3000/api/nodes?mindmapId=YOUR_ID"

# Check browser console for errors
# Open DevTools → Console

# Verify React Flow is installed
cd client
npm list reactflow

# Rebuild client
npm run dev
```

### Issue 2: Drag doesn't save position

**Symptoms:** Nodes reset position after refresh

**Solutions:**
```bash
# Check if PATCH request is being sent
# Open DevTools → Network tab
# Drag a node and look for PATCH request

# Verify update endpoint works
curl -X PATCH http://localhost:3000/api/nodes/NODE_ID \
  -H "Content-Type: application/json" \
  -d '{"position":{"x":100,"y":100}}'

# Check node-service logs for errors
```

### Issue 3: "Cannot find module" errors

**Symptoms:** TypeScript compilation errors

**Solutions:**
```bash
# Rebuild all services
cd node-service && npm run build
cd ../api-gateway && npm run build

# Restart services
# Kill all node processes
pkill -f "node dist"

# Start services again
```

### Issue 4: CORS errors in browser

**Symptoms:** Network errors, CORS policy blocks requests

**Solutions:**
```bash
# Verify API Gateway has CORS enabled
# Check api-gateway/src/index.ts
# Should have: app.use(cors());

# Restart API Gateway
cd api-gateway
npm run build
npm start
```

### Issue 5: Database connection errors

**Symptoms:** "Can't reach database server" errors

**Solutions:**
```bash
# Check databases are running
docker-compose ps

# Restart databases if needed
docker-compose restart postgres-nodes

# Verify connection string in .env
cat node-service/.env
# Should have correct DATABASE_URL
```

### Issue 6: React Flow styles missing

**Symptoms:** Canvas looks broken, no styles

**Solutions:**
```bash
# Verify React Flow CSS is imported
# In MindMapCanvas.tsx should have:
# import 'reactflow/dist/style.css';

# Clear Vite cache
cd client
rm -rf node_modules/.vite
npm run dev
```

### Issue 7: Store state not updating

**Symptoms:** UI doesn't reflect changes

**Solutions:**
```bash
# Check Zustand store setup
# Verify useMindmapStore is being called correctly

# Check React DevTools
# Open DevTools → Components
# Inspect MindmapStore state

# Verify API calls are succeeding
# Check Network tab for 200 responses
```

---

## Next Steps

After completing Phase 1, you're ready for **Phase 2: Node Content Editor**:

1. Integrate TipTap rich text editor
2. Create node editor modal
3. Add formatting toolbar
4. Enable rich text content in nodes

See the PRD for Phase 2 details.

---

## Estimated Time

- **Node Service Implementation:** 2-3 hours
- **API Gateway Setup:** 1 hour
- **Client React Flow Setup:** 3-4 hours
- **Testing & Debugging:** 2 hours
- **Polish & Refinement:** 1 hour

**Total:** ~9-11 hours (spread over 2-3 days)

---

## Summary

Phase 1 establishes the core foundation:

✅ **Backend:** Complete CRUD operations for mindmaps and nodes
✅ **API Gateway:** Routing and proxying to services
✅ **Frontend:** Visual canvas with React Flow
✅ **Persistence:** All data saved to PostgreSQL
✅ **Interactivity:** Create, position, and drag nodes

This gives you a working mindmap application ready for Phase 2 enhancements.

---

**Document Status:** Ready for Implementation
**Created:** November 2, 2025
**Phase:** 1 of 6

---

**END OF PHASE 1 IMPLEMENTATION GUIDE**
