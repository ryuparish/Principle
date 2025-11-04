# Phase 3: Edge Persistence & Management

## Overview

Phase 3 builds upon Phase 1's canvas and Phase 2's rich text editor by adding persistent connections (edges) between nodes. This enables users to visually map relationships and create meaningful connections within their mindmaps.

**Goal**: Transform isolated nodes into an interconnected knowledge graph with persistent, manageable edges.

**Key Features**:
- Create edges by dragging connections between nodes
- Edges persist to database via edge-service
- Right-click edges to add/edit labels
- Delete edges via context menu or keyboard
- Visual edge styling with React Flow
- Full CRUD operations for edges

**Tech Stack**:
- **React Flow**: Built-in edge rendering and interaction
- **Edge Service**: Backend microservice for edge persistence
- **Zustand**: State management for edge state
- **Prisma**: ORM for edge database operations
- **PostgreSQL**: JSONB storage for edge styles

## Prerequisites

Before starting Phase 3, ensure:
1. ✅ Phase 1 and Phase 2 are complete and working
2. ✅ You can create, edit, and delete nodes
3. ✅ Rich text editor works in node modals
4. ✅ All services are running (`./start-services.sh`)
5. ✅ Database is populated with at least one mindmap with nodes
6. ✅ Client is accessible at http://localhost:5174

## Architecture Changes

### Database Schema

The `Edge` table already exists in the edge-service Prisma schema:

```prisma
model Edge {
  id           String   @id @default(uuid())
  mindmapId    String
  sourceNodeId String
  targetNodeId String
  label        String?
  style        Json     @default("{}")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("edges")
}
```

**Edge Style JSON Structure**:
```json
{
  "strokeColor": "#b1b1b7",
  "strokeWidth": 2,
  "strokeDasharray": "5,5",
  "animated": false,
  "type": "default"
}
```

### Component Architecture
```
MindMapCanvas
├── ReactFlow (existing)
│   ├── Nodes (Phase 1)
│   ├── Edges (Phase 3 - new)
│   └── EdgeContextMenu (Phase 3 - new)
└── CustomNode (existing from Phase 1)
```

### Service Architecture
```
Client (React)
    ↓ HTTP
API Gateway (:3000)
    ↓ Proxy
Edge Service (:3002)
    ↓ Prisma
PostgreSQL Database
```

## Implementation Steps

### Step 1: Add Edge TypeScript Types

Update the types file to support edges:

**File**: `client/src/types/index.ts`

Add these interfaces at the end of the file:

```typescript
export interface EdgeStyle {
  strokeColor?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  animated?: boolean;
  type?: 'default' | 'straight' | 'step' | 'smoothstep';
}

export interface MindmapEdge {
  id: string;
  mindmapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  style: EdgeStyle;
  createdAt: string;
}

export interface CreateEdgeInput {
  mindmapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  style?: EdgeStyle;
}

export interface UpdateEdgeInput {
  label?: string;
  style?: EdgeStyle;
}
```

### Step 2: Create Edge API Client

Create an API client for edge operations:

**File**: `client/src/api/edge.api.ts`

```typescript
import { apiClient } from './client';
import { MindmapEdge, CreateEdgeInput, UpdateEdgeInput } from '../types';

export const edgeApi = {
  getByMindmap: async (mindmapId: string): Promise<MindmapEdge[]> => {
    const response = await apiClient.get('/edges', {
      params: { mindmapId }
    });
    return response.data.edges || response.data;
  },

  create: async (data: CreateEdgeInput): Promise<MindmapEdge> => {
    const response = await apiClient.post('/edges', data);
    return response.data;
  },

  update: async (id: string, data: UpdateEdgeInput): Promise<MindmapEdge> => {
    const response = await apiClient.patch(`/edges/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/edges/${id}`);
  }
};
```

### Step 3: Update Zustand Store for Edges

Add edge state management to the mindmap store:

**File**: `client/src/store/mindmapStore.ts`

Add to imports:
```typescript
import { MindmapEdge, UpdateEdgeInput } from '../types';
import { edgeApi } from '../api/edge.api';
```

Add to interface:
```typescript
interface MindmapStore {
  // ... existing state
  edges: MindmapEdge[];

  // ... existing actions
  loadEdges: (mindmapId: string) => Promise<void>;
  createEdge: (sourceNodeId: string, targetNodeId: string, label?: string) => Promise<MindmapEdge>;
  updateEdge: (id: string, data: UpdateEdgeInput) => Promise<void>;
  deleteEdge: (id: string) => Promise<void>;
}
```

Add to initial state:
```typescript
export const useMindmapStore = create<MindmapStore>((set, get) => ({
  // ... existing state
  edges: [],

  // ... existing actions (add these at the end before the closing }))

  loadEdges: async (mindmapId: string) => {
    try {
      const edges = await edgeApi.getByMindmap(mindmapId);
      set({ edges });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  createEdge: async (sourceNodeId: string, targetNodeId: string, label?: string) => {
    const { currentMindmap } = get();
    if (!currentMindmap) {
      throw new Error('No mindmap selected');
    }

    try {
      const edge = await edgeApi.create({
        mindmapId: currentMindmap.id,
        sourceNodeId,
        targetNodeId,
        label,
        style: {}
      });
      set((state) => ({
        edges: [...state.edges, edge]
      }));
      return edge;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateEdge: async (id: string, data: UpdateEdgeInput) => {
    try {
      const updated = await edgeApi.update(id, data);
      set((state) => ({
        edges: state.edges.map((e) =>
          e.id === id
            ? { ...e, ...data }
            : e
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteEdge: async (id: string) => {
    try {
      await edgeApi.delete(id);
      set((state) => ({
        edges: state.edges.filter((e) => e.id !== id)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
```

### Step 4: Update MindMapCanvas for Edges

Modify the canvas component to load and render edges:

**File**: `client/src/components/Canvas/MindMapCanvas.tsx`

Add to imports:
```typescript
import EdgeContextMenu from '../Edge/EdgeContextMenu';
```

Add to destructured store:
```typescript
const {
  nodes: storeNodes,
  edges: storeEdges,  // Add this
  loadMindmap,
  loadEdges,          // Add this
  createNode,
  updateNode,
  deleteNodes,
  createEdge,         // Add this
  deleteEdge          // Add this
} = useMindmapStore();
```

Add state for edge context menu:
```typescript
const [edgeMenuState, setEdgeMenuState] = useState<{
  edge: Edge | null;
  x: number;
  y: number;
} | null>(null);
```

Update the load effect to include edges:
```typescript
// Load mindmap data
useEffect(() => {
  loadMindmap(mindmapId);
  loadEdges(mindmapId);  // Add this line
}, [mindmapId, loadMindmap, loadEdges]);
```

Add effect to convert store edges to React Flow edges:
```typescript
// Convert store edges to React Flow edges
useEffect(() => {
  const reactFlowEdges: Edge[] = storeEdges.map((edge) => ({
    id: edge.id,
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    label: edge.label,
    type: edge.style.type || 'default',
    animated: edge.style.animated || false,
    style: {
      stroke: edge.style.strokeColor || '#b1b1b7',
      strokeWidth: edge.style.strokeWidth || 2,
      strokeDasharray: edge.style.strokeDasharray
    }
  }));
  setEdges(reactFlowEdges);
}, [storeEdges]);
```

Update `onConnect` to persist edges:
```typescript
const onConnect = useCallback(
  async (connection: Connection) => {
    if (!connection.source || !connection.target) return;

    try {
      // Create edge in database - React Flow edge will be added automatically via store update
      await createEdge(connection.source, connection.target);
    } catch (error) {
      console.error('Failed to create edge:', error);
    }
  },
  [createEdge]
);
```

Add edge deletion handler:
```typescript
const onEdgesDelete = useCallback(
  async (edgesToDelete: Edge[]) => {
    for (const edge of edgesToDelete) {
      try {
        await deleteEdge(edge.id);
      } catch (error) {
        console.error('Failed to delete edge:', error);
      }
    }
  },
  [deleteEdge]
);
```

Add edge context menu handler:
```typescript
const onEdgeContextMenu = useCallback(
  (event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setEdgeMenuState({
      edge,
      x: event.clientX,
      y: event.clientY
    });
  },
  []
);
```

Update ReactFlow component props:
```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  onEdgesDelete={onEdgesDelete}         // Add this
  onEdgeContextMenu={onEdgeContextMenu} // Add this
  onPaneClick={onPaneClick}
  onSelectionChange={onSelectionChange}
  nodeTypes={nodeTypes}
  selectionOnDrag
  selectionKeyCode="Shift"
  multiSelectionKeyCode="Meta"
  fitView
>
  <Controls />
  <MiniMap />
  <Background gap={12} size={1} />
</ReactFlow>

{edgeMenuState && (
  <EdgeContextMenu
    edge={edgeMenuState.edge!}
    x={edgeMenuState.x}
    y={edgeMenuState.y}
    onClose={() => setEdgeMenuState(null)}
  />
)}
```

### Step 5: Create EdgeContextMenu Component

Create the context menu for edge operations:

**File**: `client/src/components/Edge/EdgeContextMenu.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Edge } from 'reactflow';
import { useMindmapStore } from '../../store/mindmapStore';
import './EdgeContextMenu.css';

interface EdgeContextMenuProps {
  edge: Edge;
  x: number;
  y: number;
  onClose: () => void;
}

const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({
  edge,
  x,
  y,
  onClose
}) => {
  const { updateEdge, deleteEdge } = useMindmapStore();
  const [label, setLabel] = useState(edge.label?.toString() || '');

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.edge-context-menu')) {
        onClose();
      }
    };

    // Delay adding the listener to avoid immediate close
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  const handleSaveLabel = async () => {
    try {
      await updateEdge(edge.id, { label: label || undefined });
      onClose();
    } catch (error) {
      console.error('Failed to update edge label:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEdge(edge.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete edge:', error);
    }
  };

  return (
    <div
      className="edge-context-menu"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="menu-section">
        <label>Label:</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Connection label"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSaveLabel();
            }
          }}
        />
        <button onClick={handleSaveLabel}>Save</button>
      </div>

      <div className="menu-divider" />

      <button
        className="delete-button"
        onClick={handleDelete}
      >
        Delete Connection
      </button>
    </div>
  );
};

export default EdgeContextMenu;
```

### Step 6: Create EdgeContextMenu Styles

**File**: `client/src/components/Edge/EdgeContextMenu.css`

```css
.edge-context-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  padding: 12px;
  z-index: 1001;
  min-width: 220px;
  animation: menuFadeIn 0.15s ease;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-section label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-section input {
  padding: 8px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: border-color 0.15s ease;
}

.menu-section input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.menu-section button {
  padding: 8px 14px;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s ease;
}

.menu-section button:hover {
  background: #0052a3;
}

.menu-section button:active {
  transform: scale(0.98);
}

.menu-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 10px 0;
}

.delete-button {
  width: 100%;
  padding: 8px 14px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s ease;
}

.delete-button:hover {
  background: #b91c1c;
}

.delete-button:active {
  transform: scale(0.98);
}
```

### Step 7: Implement Edge Service Backend

The edge-service already has a Prisma schema, but needs the actual endpoints implemented.

**File**: `edge-service/src/services/edge.service.ts` (CREATE)

```typescript
import { PrismaClient, Edge } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateEdgeInput {
  mindmapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  style?: any;
}

export interface UpdateEdgeInput {
  label?: string;
  style?: any;
}

export class EdgeService {
  async getEdgesByMindmap(mindmapId: string): Promise<Edge[]> {
    return prisma.edge.findMany({
      where: { mindmapId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getEdgeById(id: string): Promise<Edge | null> {
    return prisma.edge.findUnique({
      where: { id }
    });
  }

  async createEdge(data: CreateEdgeInput): Promise<Edge> {
    return prisma.edge.create({
      data: {
        mindmapId: data.mindmapId,
        sourceNodeId: data.sourceNodeId,
        targetNodeId: data.targetNodeId,
        label: data.label,
        style: data.style || {}
      }
    });
  }

  async updateEdge(id: string, data: UpdateEdgeInput): Promise<Edge> {
    return prisma.edge.update({
      where: { id },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.style !== undefined && { style: data.style })
      }
    });
  }

  async deleteEdge(id: string): Promise<void> {
    await prisma.edge.delete({
      where: { id }
    });
  }
}

export const edgeService = new EdgeService();
```

**File**: `edge-service/src/controllers/edge.controller.ts` (CREATE)

```typescript
import { Request, Response } from 'express';
import { edgeService } from '../services/edge.service';

export class EdgeController {
  async getByMindmap(req: Request, res: Response) {
    try {
      const { mindmapId } = req.query;

      if (!mindmapId || typeof mindmapId !== 'string') {
        return res.status(400).json({ error: 'mindmapId query parameter is required' });
      }

      const edges = await edgeService.getEdgesByMindmap(mindmapId);
      res.json({ edges });
    } catch (error) {
      console.error('Error fetching edges:', error);
      res.status(500).json({ error: 'Failed to fetch edges' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const edge = await edgeService.getEdgeById(id);

      if (!edge) {
        return res.status(404).json({ error: 'Edge not found' });
      }

      res.json(edge);
    } catch (error) {
      console.error('Error fetching edge:', error);
      res.status(500).json({ error: 'Failed to fetch edge' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { mindmapId, sourceNodeId, targetNodeId, label, style } = req.body;

      // Validation
      if (!mindmapId) {
        return res.status(400).json({ error: 'mindmapId is required' });
      }
      if (!sourceNodeId) {
        return res.status(400).json({ error: 'sourceNodeId is required' });
      }
      if (!targetNodeId) {
        return res.status(400).json({ error: 'targetNodeId is required' });
      }

      const edge = await edgeService.createEdge({
        mindmapId,
        sourceNodeId,
        targetNodeId,
        label,
        style
      });

      res.status(201).json(edge);
    } catch (error) {
      console.error('Error creating edge:', error);
      res.status(500).json({ error: 'Failed to create edge' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { label, style } = req.body;

      const edge = await edgeService.updateEdge(id, {
        label,
        style
      });

      res.json(edge);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Edge not found' });
      }
      console.error('Error updating edge:', error);
      res.status(500).json({ error: 'Failed to update edge' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await edgeService.deleteEdge(id);
      res.json({ success: true, message: 'Edge deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Edge not found' });
      }
      console.error('Error deleting edge:', error);
      res.status(500).json({ error: 'Failed to delete edge' });
    }
  }
}

export const edgeController = new EdgeController();
```

**File**: `edge-service/src/routes/edge.routes.ts` (CREATE)

```typescript
import { Router } from 'express';
import { edgeController } from '../controllers/edge.controller';

const router = Router();

router.get('/', (req, res) => edgeController.getByMindmap(req, res));
router.get('/:id', (req, res) => edgeController.getById(req, res));
router.post('/', (req, res) => edgeController.create(req, res));
router.patch('/:id', (req, res) => edgeController.update(req, res));
router.delete('/:id', (req, res) => edgeController.delete(req, res));

export default router;
```

**File**: `edge-service/src/index.ts` (MODIFY)

Add imports:
```typescript
import edgeRoutes from './routes/edge.routes';
```

Add route registration before `app.listen()`:
```typescript
// API Routes
app.use('/edges', edgeRoutes);
```

### Step 8: Build and Restart Edge Service

```bash
cd edge-service
npx prisma generate
npm run build
```

Kill existing edge-service processes:
```bash
lsof -ti:3002 | xargs kill -9
```

Restart edge-service:
```bash
PORT=3002 npm start &
```

### Step 9: Add Edge Routes to API Gateway

**File**: `api-gateway/src/routes/edge.routes.ts` (CREATE)

```typescript
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { services } from '../config/services.config';

const router = Router();

// Get edges by mindmap
router.get('/', async (req: Request, res: Response) => {
  try {
    const { mindmapId } = req.query;
    const response = await axios.get(`${services.edgeService}/edges`, {
      params: { mindmapId }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching edges:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch edges'
    });
  }
});

// Get edge by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${services.edgeService}/edges/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching edge:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch edge'
    });
  }
});

// Create edge
router.post('/', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${services.edgeService}/edges`, req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('Error creating edge:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to create edge'
    });
  }
});

// Update edge
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.patch(`${services.edgeService}/edges/${id}`, req.body);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error updating edge:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to update edge'
    });
  }
});

// Delete edge
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.delete(`${services.edgeService}/edges/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error deleting edge:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to delete edge'
    });
  }
});

export default router;
```

**File**: `api-gateway/src/index.ts` (MODIFY)

Add import:
```typescript
import edgeRoutes from './routes/edge.routes';
```

Update endpoints documentation:
```typescript
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Principle API Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      mindmaps: '/api/mindmaps',
      nodes: '/api/nodes',
      edges: '/api/edges'  // Add this
    }
  });
});
```

Add route registration:
```typescript
// API Routes
app.use('/api/mindmaps', mindmapRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/edges', edgeRoutes);  // Add this
```

### Step 10: Build and Restart API Gateway

```bash
cd api-gateway
npm run build
```

Kill existing gateway processes:
```bash
lsof -ti:3000 | xargs kill -9
```

Restart API gateway:
```bash
PORT=3000 npm start &
```

### Step 11: Test the Implementation

#### Manual Testing Steps:

1. **Start all services**:
```bash
./restart-services.sh
```

2. **Open the client**:
```
http://localhost:5174
```

3. **Test edge creation**:
   - Click on a node's bottom handle (source)
   - Drag to another node's top handle (target)
   - Release to create the edge
   - Verify the edge appears
   - Refresh the page
   - Verify the edge persists

4. **Test edge labeling**:
   - Right-click on an edge
   - Verify the context menu appears
   - Type a label in the input field
   - Press Enter or click "Save"
   - Verify the label appears on the edge
   - Refresh and verify persistence

5. **Test edge deletion via context menu**:
   - Right-click on an edge
   - Click "Delete Connection"
   - Verify the edge disappears
   - Refresh and verify it's gone

6. **Test edge deletion via keyboard**:
   - Click to select an edge
   - Press Delete or Backspace
   - Verify the edge is deleted

7. **Test multiple edges**:
   - Create multiple edges between different nodes
   - Verify all edges persist
   - Label different edges with different labels
   - Delete some edges, keep others

#### API Testing:

Test the edge service directly:
```bash
# Get edges for a mindmap
curl "http://localhost:3002/edges?mindmapId=YOUR_MINDMAP_ID"

# Create an edge
curl -X POST http://localhost:3002/edges \
  -H "Content-Type: application/json" \
  -d '{
    "mindmapId": "YOUR_MINDMAP_ID",
    "sourceNodeId": "SOURCE_NODE_ID",
    "targetNodeId": "TARGET_NODE_ID",
    "label": "relates to"
  }'

# Update edge label
curl -X PATCH http://localhost:3002/edges/EDGE_ID \
  -H "Content-Type: application/json" \
  -d '{"label": "updated label"}'

# Delete an edge
curl -X DELETE http://localhost:3002/edges/EDGE_ID
```

Test through API gateway:
```bash
# Same as above but use http://localhost:3000/api/edges instead
curl "http://localhost:3000/api/edges?mindmapId=YOUR_MINDMAP_ID"
```

#### Database Verification:

Check that edges are stored:
```bash
PGPASSWORD=principle_pass psql -h localhost -U principle_user -d principle_db -c "SELECT * FROM edges;"
```

Expected output:
```
                  id                  |             mindmapId              | sourceNodeId | targetNodeId |   label    | style | createdAt | updatedAt
--------------------------------------+------------------------------------+--------------+--------------+------------+-------+-----------+-----------
 abc-123-def                          | 494ded8c-3316-...                  | node-1-id    | node-2-id    | relates to | {}    | ...       | ...
```

## Success Criteria

Phase 3 is complete when:

- [x] Edge TypeScript types added to types file
- [x] Edge API client created
- [x] Zustand store updated with edge state and actions
- [x] MindMapCanvas loads and displays edges
- [x] Edges can be created by dragging between nodes
- [x] Edges persist to database
- [x] Right-clicking edge shows context menu
- [x] Edge labels can be added and updated
- [x] Edges can be deleted via context menu
- [x] Edges can be deleted via keyboard (Delete/Backspace)
- [x] Edge-service has full CRUD endpoints
- [x] API Gateway routes edge requests correctly
- [x] All edges persist across page refreshes
- [x] Multiple edges can exist on same mindmap

## Troubleshooting

### Issue: 404 Error when loading edges

**Symptom**: `GET http://localhost:3000/api/edges?mindmapId=... 404 (Not Found)`

**Solution**:
1. Verify edge-service is running:
```bash
curl http://localhost:3002/health
```

2. Verify API gateway edge routes are registered:
```bash
curl http://localhost:3000/
# Should list /api/edges in endpoints
```

3. Check edge-service has routes:
```bash
cd edge-service
cat src/index.ts | grep "app.use"
# Should include: app.use('/edges', edgeRoutes)
```

4. Rebuild and restart services:
```bash
cd edge-service && npm run build && PORT=3002 npm start &
cd ../api-gateway && npm run build && PORT=3000 npm start &
```

### Issue: Edges not persisting after refresh

**Symptom**: Edges disappear after page reload

**Solution**:
1. Check browser console for API errors
2. Verify `loadEdges()` is called in MindMapCanvas:
```typescript
useEffect(() => {
  loadMindmap(mindmapId);
  loadEdges(mindmapId);  // Must be here
}, [mindmapId, loadMindmap, loadEdges]);
```

3. Check database for edges:
```bash
PGPASSWORD=principle_pass psql -h localhost -U principle_user -d principle_db -c "SELECT COUNT(*) FROM edges;"
```

### Issue: Context menu doesn't appear

**Symptom**: Right-clicking edge doesn't show menu

**Solution**:
1. Verify `EdgeContextMenu` is imported and rendered in MindMapCanvas
2. Check `onEdgeContextMenu` is passed to ReactFlow:
```typescript
<ReactFlow
  ...
  onEdgeContextMenu={onEdgeContextMenu}
>
```

3. Verify EdgeContextMenu.css is imported in EdgeContextMenu.tsx

### Issue: Prisma errors in edge-service

**Symptom**: `Property 'edge' does not exist on type 'PrismaClient'`

**Solution**:
1. Generate Prisma client:
```bash
cd edge-service
npx prisma generate
```

2. Verify schema.prisma has Edge model
3. Rebuild TypeScript:
```bash
npm run build
```

### Issue: Edges created but not visible

**Symptom**: API shows edges exist but canvas is blank

**Solution**:
1. Check store is converting edges to React Flow format:
```typescript
// In MindMapCanvas.tsx, add console.log
useEffect(() => {
  console.log('Store edges:', storeEdges);
  console.log('React Flow edges:', edges);
}, [storeEdges, edges]);
```

2. Verify edge IDs match node IDs:
```bash
# Check if sourceNodeId/targetNodeId exist in nodes table
PGPASSWORD=principle_pass psql -h localhost -U principle_user -d principle_db -c "
  SELECT e.id, e.sourceNodeId, e.targetNodeId,
         n1.id as source_exists, n2.id as target_exists
  FROM edges e
  LEFT JOIN mindmap_nodes n1 ON e.sourceNodeId = n1.id
  LEFT JOIN mindmap_nodes n2 ON e.targetNodeId = n2.id;
"
```

## Architecture Summary

### Frontend Components
```
client/src/
├── components/
│   ├── Canvas/
│   │   └── MindMapCanvas.tsx (updated - edge loading, creation, deletion)
│   ├── Edge/
│   │   ├── EdgeContextMenu.tsx (new - context menu for edges)
│   │   └── EdgeContextMenu.css (new - context menu styles)
│   └── Node/
│       └── CustomNode.tsx (unchanged from Phase 2)
├── store/
│   └── mindmapStore.ts (updated - edge state and actions)
├── api/
│   └── edge.api.ts (new - edge HTTP client)
└── types/
    └── index.ts (updated - edge interfaces)
```

### Backend Services
```
edge-service/
├── src/
│   ├── services/
│   │   └── edge.service.ts (new - database operations)
│   ├── controllers/
│   │   └── edge.controller.ts (new - HTTP handlers)
│   ├── routes/
│   │   └── edge.routes.ts (new - Express routes)
│   └── index.ts (updated - route registration)
└── prisma/
    └── schema.prisma (existing - Edge model)

api-gateway/
└── src/
    ├── routes/
    │   └── edge.routes.ts (new - proxy routes)
    └── index.ts (updated - edge route registration)
```

## Next Steps: Phase 4

Phase 3 provides the foundation for connected mindmaps. Phase 4 will add:

1. **AI-Powered Features**: Auto-generate related nodes, suggest connections
2. **Advanced Edge Styling**: Different edge types, colors, arrow styles
3. **Auto-Layout Algorithms**: Organize connected nodes intelligently
4. **Hierarchical Views**: Tree view, graph view, list view
5. **Search & Filter**: Find nodes by content, connections, tags

To begin Phase 4, ensure Phase 3 success criteria are met, then refer to `Phase_4_AI_Integration.md` (to be created).

## Performance Considerations

1. **Batch edge loading**: All edges loaded in single API call
2. **Optimistic UI updates**: Edges appear immediately, persist in background
3. **Selective re-rendering**: Only affected edges re-render on update
4. **Database indexing**: mindmapId indexed for fast edge queries

## Security Considerations

1. **Ownership validation**: Edge creation validates mindmap ownership
2. **Node existence validation**: Prevents orphaned edges
3. **Input sanitization**: Labels sanitized before storage
4. **CORS configuration**: API gateway restricts edge operations to authenticated users

---

**Phase 3 Complete!** You now have a fully connected mindmap with persistent edges. Users can visually map relationships and create meaningful knowledge graphs.
Are you sure you want to delete this image?