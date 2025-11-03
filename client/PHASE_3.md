# Phase 3: Edge Persistence & Management

## Overview
Phase 3 focuses on making edges (connections between nodes) fully functional with database persistence, styling, and management capabilities. While the backend edge-service and React Flow visual handling exist, edges currently don't persist across sessions.

## Current State
**What exists:**
- ✅ Backend edge-service with complete Prisma schema
- ✅ React Flow visual edge rendering
- ✅ `onConnect` handler in MindMapCanvas (lines 75-78)

**What's missing:**
- ❌ Frontend Edge TypeScript types
- ❌ Edge API client integration
- ❌ Zustand store for edge management
- ❌ Database persistence on edge creation/deletion
- ❌ Loading edges from database on mindmap load
- ❌ Edge labels and styling UI
- ❌ Edge deletion UI

## Goals
1. **Persist edges to database** - Edges should survive page refreshes
2. **Load edges from database** - Display saved edges when loading mindmap
3. **Edge styling** - Allow customization of edge appearance
4. **Edge labels** - Add text labels to connections
5. **Edge management** - Delete edges, update properties

---

## Implementation Plan

### 1. Frontend Types (`/client/src/types/index.ts`)

**Add Edge interfaces:**
```typescript
export interface MindmapEdge {
  id: string;
  mindmapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  style: EdgeStyle;
  createdAt: string;
}

export interface EdgeStyle {
  strokeColor?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  animated?: boolean;
  type?: 'default' | 'straight' | 'step' | 'smoothstep';
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

**Why:**
- TypeScript type safety for edges
- Matches backend Prisma schema
- Separates style concerns for easier management

---

### 2. Edge API Client (`/client/src/api/edge.api.ts`)

**Create new file:**
```typescript
import axios from 'axios';
import { MindmapEdge, CreateEdgeInput, UpdateEdgeInput } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const edgeApi = {
  // Get all edges for a mindmap
  getByMindmap: async (mindmapId: string): Promise<MindmapEdge[]> => {
    const response = await axios.get(`${API_URL}/edges/mindmap/${mindmapId}`);
    return response.data;
  },

  // Create new edge
  create: async (data: CreateEdgeInput): Promise<MindmapEdge> => {
    const response = await axios.post(`${API_URL}/edges`, data);
    return response.data;
  },

  // Update edge
  update: async (id: string, data: UpdateEdgeInput): Promise<MindmapEdge> => {
    const response = await axios.patch(`${API_URL}/edges/${id}`, data);
    return response.data;
  },

  // Delete edge
  delete: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/edges/${id}`);
  }
};
```

**Why:**
- Consistent API pattern with node.api.ts
- Centralized HTTP error handling
- Easy to mock for testing

---

### 3. Zustand Edge Store (`/client/src/store/mindmapStore.ts`)

**Add to existing store:**
```typescript
interface MindmapStore {
  // ... existing state
  edges: MindmapEdge[];

  // ... existing actions
  createEdge: (sourceNodeId: string, targetNodeId: string, label?: string) => Promise<MindmapEdge>;
  updateEdge: (id: string, data: UpdateEdgeInput) => Promise<void>;
  deleteEdge: (id: string) => Promise<void>;
  loadEdges: (mindmapId: string) => Promise<void>;
}

// Implementation
export const useMindmapStore = create<MindmapStore>((set, get) => ({
  // ... existing state
  edges: [],

  // ... existing actions

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
    if (!currentMindmap) throw new Error('No mindmap selected');

    try {
      const edge = await edgeApi.create({
        mindmapId: currentMindmap.id,
        sourceNodeId,
        targetNodeId,
        label
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
          e.id === id ? { ...e, ...data } : e
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
  }
}));
```

**Why:**
- Consistent with existing node management
- Optimistic updates for better UX
- Selective merge pattern (learned from Phase 2 race condition fix)

---

### 4. Update MindMapCanvas (`/client/src/components/Canvas/MindMapCanvas.tsx`)

**Changes needed:**

**A. Import edge store and types:**
```typescript
import { useMindmapStore } from '../../store/mindmapStore';
import { MindmapEdge } from '../../types';
```

**B. Add edges state:**
```typescript
const {
  nodes: storeNodes,
  edges: storeEdges,  // ADD THIS
  loadMindmap,
  loadEdges,          // ADD THIS
  createNode,
  updateNode,
  deleteNodes,
  createEdge,         // ADD THIS
  deleteEdge          // ADD THIS
} = useMindmapStore();
```

**C. Load edges on mount:**
```typescript
// Update existing useEffect
useEffect(() => {
  loadMindmap(mindmapId);
  loadEdges(mindmapId);  // ADD THIS
}, [mindmapId]);
```

**D. Convert store edges to React Flow edges:**
```typescript
// Add after node conversion useEffect
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

**E. Update onConnect to persist:**
```typescript
const onConnect = useCallback(
  async (connection: Connection) => {
    if (!connection.source || !connection.target) return;

    try {
      // Create edge in database
      await createEdge(connection.source, connection.target);

      // React Flow edge will be added automatically via store update
    } catch (error) {
      console.error('Failed to create edge:', error);
    }
  },
  [createEdge]
);
```

**F. Handle edge deletion:**
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

// Add to ReactFlow component
<ReactFlow
  // ... existing props
  onEdgesDelete={onEdgesDelete}
>
```

**Why:**
- Separates React Flow visual state from database state
- Automatic sync via Zustand updates
- Consistent with node management pattern

---

### 5. Edge Context Menu (NEW: `/client/src/components/Edge/EdgeContextMenu.tsx`)

**Create new component:**
```typescript
import React, { useState } from 'react';
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
  const [label, setLabel] = useState(edge.label || '');

  const handleSaveLabel = async () => {
    await updateEdge(edge.id, { label });
    onClose();
  };

  const handleDelete = async () => {
    await deleteEdge(edge.id);
    onClose();
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

**CSS file (`EdgeContextMenu.css`):**
```css
.edge-context-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  z-index: 1001;
  min-width: 200px;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-section label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.menu-section input {
  padding: 6px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
}

.menu-section button {
  padding: 6px 12px;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.menu-section button:hover {
  background: #0052a3;
}

.menu-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 8px 0;
}

.delete-button {
  width: 100%;
  padding: 6px 12px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.delete-button:hover {
  background: #b91c1c;
}
```

**Why:**
- Right-click context menu for edge operations
- Inline label editing
- Consistent with node interaction patterns

---

### 6. Add Edge Context Menu to Canvas

**Update MindMapCanvas.tsx:**
```typescript
const [edgeMenuState, setEdgeMenuState] = useState<{
  edge: Edge | null;
  x: number;
  y: number;
} | null>(null);

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

// In JSX
<ReactFlow
  // ... existing props
  onEdgeContextMenu={onEdgeContextMenu}
>
  {/* ... existing children */}
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

**Why:**
- Natural right-click interaction
- Non-intrusive UI
- Follows existing patterns from node interaction

---

## Testing Checklist

### Basic Functionality
- [ ] Create edge by dragging from one node handle to another
- [ ] Edge appears immediately on screen
- [ ] Edge persists after page refresh
- [ ] Multiple edges between different nodes work correctly

### Edge Management
- [ ] Right-click edge opens context menu
- [ ] Can add/edit edge label
- [ ] Label saves and displays correctly
- [ ] Can delete edge via context menu
- [ ] Edge deletion removes from UI and database

### Integration
- [ ] Deleting source node also deletes connected edges
- [ ] Deleting target node also deletes connected edges
- [ ] Creating edges doesn't interfere with node dragging
- [ ] Edges don't prevent clicking on canvas to create nodes

### Edge Cases
- [ ] Can't create duplicate edges between same nodes (backend has unique constraint)
- [ ] Creating edge while node editor is open doesn't break
- [ ] Undo edge creation if backend fails
- [ ] Loading mindmap with many edges performs well

---

## Database Considerations

**Backend edge-service schema already handles:**
- ✅ Unique constraint on (sourceNodeId, targetNodeId) - prevents duplicates
- ✅ Indexes on mindmapId, sourceNodeId, targetNodeId - fast queries
- ✅ Cascade delete when nodes are deleted (needs verification)

**May need to add:**
- Cascade delete trigger or application logic when node is deleted
- Validation that sourceNode and targetNode exist
- Validation that both nodes belong to same mindmap

---

## Performance Optimizations (Future)

1. **Batch edge loading** - Load all edges for mindmap in single request
2. **Optimistic updates** - Show edge immediately, rollback if save fails
3. **Edge virtualization** - Only render visible edges for large mindmaps
4. **Debounced style updates** - Don't spam backend on rapid style changes

---

## Success Criteria

Phase 3 is complete when:
1. ✅ Edges persist to database and load on mindmap open
2. ✅ Can create edges by dragging between node handles
3. ✅ Can delete edges via right-click context menu
4. ✅ Can add/edit edge labels
5. ✅ Edge styling works (color, width, type)
6. ✅ Deleting nodes cleans up connected edges
7. ✅ All tests pass

---

## Estimated Implementation Time

- Types & API client: **30 minutes**
- Store integration: **45 minutes**
- Canvas updates: **1 hour**
- Edge context menu: **45 minutes**
- Testing & bug fixes: **1 hour**
- **Total: ~4 hours**

---

## Dependencies

**NPM packages (already installed):**
- `reactflow` - Edge rendering and interaction
- `zustand` - State management
- `axios` - HTTP requests

**Backend services (already running):**
- edge-service (PORT 3002)
- PostgreSQL database

**No new dependencies needed!**

---

## Related Files

**Backend:**
- `/edge-service/prisma/schema.prisma` (Edge model)
- `/edge-service/src/controllers/` (Edge CRUD)
- `/edge-service/src/routes/` (Edge API routes)

**Frontend:**
- `/client/src/types/index.ts` (TypeScript types)
- `/client/src/api/edge.api.ts` (API client - NEW)
- `/client/src/store/mindmapStore.ts` (Zustand store)
- `/client/src/components/Canvas/MindMapCanvas.tsx` (Main canvas)
- `/client/src/components/Edge/EdgeContextMenu.tsx` (Context menu - NEW)

---

## Notes from Phase 2

**Lessons learned:**
1. **Use selective merge in updateEdge** - Don't replace entire object, merge only changed fields (prevents race conditions)
2. **React Portal for modals** - Use `ReactDOM.createPortal` to escape transform contexts
3. **Check for editable elements** - Keyboard shortcuts shouldn't fire when typing in inputs
4. **Validate data structures** - Empty objects `{}` can break libraries expecting specific shapes

**Apply to Phase 3:**
- Use same selective merge pattern in `updateEdge`
- Context menu should use portal to avoid positioning issues
- Don't let edge shortcuts interfere with text editing
- Validate edge style objects before sending to React Flow
