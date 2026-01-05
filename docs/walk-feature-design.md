# Walk Feature - Design Document

## Summary

Implement a "Walk" feature that enables Prezi-style presentations through concept maps. Users can select nodes in sequence, add annotations to each step, and play a presentation that smoothly zooms between nodes. Walks represent thought processes, trains of thought, or explanations using the graph structure.

## User Requirements

- **Walk Creation**: Select nodes in order to build a walk sequence
- **Annotations**: Add custom annotations/notes to each step (separate from node content)
- **Presentation Mode**: Prezi-style zoom animations between nodes
- **Navigation**: Forward/backward through steps, keyboard controls
- **Persistence**: Walks saved per concept map
- **Multiple Walks**: Support multiple walks per map

## Data Model

### Walk Entity (New Database Table)

```typescript
interface Walk {
  id: string;              // UUID
  conceptMapId: string;    // FK to ConceptMap
  name: string;            // User-defined name
  description?: string;    // Optional description
  createdAt: Date;
  updatedAt: Date;
}

interface WalkStep {
  id: string;              // UUID
  walkId: string;          // FK to Walk
  nodeId: string;          // FK to Node
  order: number;           // Sequence position (0-indexed)
  annotation?: string;     // Rich text annotation for this step
  zoomLevel?: number;      // Custom zoom (default: 1.5)
  duration?: number;       // Auto-advance delay in ms (optional)
  createdAt: Date;
}
```

### TypeORM Entity Files

**`node-service/src/entities/Walk.ts`**
```typescript
@Entity('walks')
export class Walk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conceptMapId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => WalkStep, step => step.walk, { cascade: true })
  steps: WalkStep[];
}

@Entity('walk_steps')
export class WalkStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  walkId: string;

  @Column()
  nodeId: string;

  @Column()
  order: number;

  @Column({ nullable: true, type: 'text' })
  annotation: string;

  @Column({ nullable: true, type: 'float', default: 1.5 })
  zoomLevel: number;

  @Column({ nullable: true })
  duration: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Walk, walk => walk.steps, { onDelete: 'CASCADE' })
  walk: Walk;
}
```

## Files to Create/Modify

| File | Type | Description |
|------|------|-------------|
| `node-service/src/entities/Walk.ts` | NEW | Walk and WalkStep entities |
| `node-service/src/services/walk.service.ts` | NEW | Walk CRUD operations |
| `node-service/src/controllers/walk.controller.ts` | NEW | REST endpoints |
| `node-service/src/routes/walk.routes.ts` | NEW | Route definitions |
| `client/src/store/walkStore.ts` | NEW | Zustand store for walks |
| `client/src/api/walk.api.ts` | NEW | API client for walks |
| `client/src/types/walk.ts` | NEW | TypeScript types |
| `client/src/components/Walk/WalkPanel.tsx` | NEW | Walk creation/editing panel |
| `client/src/components/Walk/WalkPanel.css` | NEW | Panel styles |
| `client/src/components/Walk/WalkPresentation.tsx` | NEW | Presentation mode overlay |
| `client/src/components/Walk/WalkPresentation.css` | NEW | Presentation styles |
| `client/src/components/Walk/WalkStepEditor.tsx` | NEW | Step annotation editor |
| `client/src/components/Canvas/ConceptMapCanvas.tsx` | MODIFY | Add walk mode integration |
| `client/src/contexts/VimContext.tsx` | MODIFY | Add walk-related vim state |
| `client/src/types/vim.types.ts` | MODIFY | Add walk vim types |
| `api-gateway/src/index.ts` | MODIFY | Add walk routes proxy |

## Implementation Plan

### Phase 1: Backend - Walk Service

#### 1.1 Create Walk Entity (`node-service/src/entities/Walk.ts`)
- Walk table with id, conceptMapId, name, description, timestamps
- WalkStep table with walkId, nodeId, order, annotation, zoomLevel, duration
- Cascade delete steps when walk is deleted

#### 1.2 Create Walk Service (`node-service/src/services/walk.service.ts`)
```typescript
class WalkService {
  // CRUD for walks
  getWalksByConceptMap(conceptMapId: string): Promise<Walk[]>
  getWalkById(id: string): Promise<Walk>
  createWalk(input: CreateWalkInput): Promise<Walk>
  updateWalk(id: string, input: UpdateWalkInput): Promise<Walk>
  deleteWalk(id: string): Promise<void>

  // Step management
  addStep(walkId: string, nodeId: string, order: number): Promise<WalkStep>
  updateStep(stepId: string, input: UpdateStepInput): Promise<WalkStep>
  removeStep(stepId: string): Promise<void>
  reorderSteps(walkId: string, stepIds: string[]): Promise<WalkStep[]>
}
```

#### 1.3 Create Walk Controller and Routes
```
GET    /walks?conceptMapId=:id     - List walks for a map
GET    /walks/:id                  - Get walk with steps
POST   /walks                      - Create walk
PATCH  /walks/:id                  - Update walk metadata
DELETE /walks/:id                  - Delete walk

POST   /walks/:id/steps            - Add step to walk
PATCH  /walks/:id/steps/:stepId    - Update step (annotation, zoom, etc.)
DELETE /walks/:id/steps/:stepId    - Remove step
PUT    /walks/:id/steps/reorder    - Reorder all steps
```

### Phase 2: Frontend - Walk Store

#### 2.1 Types (`client/src/types/walk.ts`)
```typescript
export interface Walk {
  id: string;
  conceptMapId: string;
  name: string;
  description?: string;
  steps: WalkStep[];
  createdAt: string;
  updatedAt: string;
}

export interface WalkStep {
  id: string;
  walkId: string;
  nodeId: string;
  order: number;
  annotation?: string;
  zoomLevel: number;
  duration?: number;
}

export interface CreateWalkInput {
  conceptMapId: string;
  name: string;
  description?: string;
}

export interface UpdateStepInput {
  annotation?: string;
  zoomLevel?: number;
  duration?: number;
}
```

#### 2.2 Walk Store (`client/src/store/walkStore.ts`)
```typescript
interface WalkStore {
  // State
  walks: Walk[];
  currentWalk: Walk | null;
  isEditing: boolean;
  isPresenting: boolean;
  currentStepIndex: number;

  // Walk CRUD
  loadWalks: (conceptMapId: string) => Promise<void>;
  createWalk: (input: CreateWalkInput) => Promise<Walk>;
  updateWalk: (id: string, input: Partial<Walk>) => Promise<void>;
  deleteWalk: (id: string) => Promise<void>;
  selectWalk: (walk: Walk | null) => void;

  // Step management
  addStep: (nodeId: string) => Promise<void>;
  removeStep: (stepId: string) => Promise<void>;
  updateStep: (stepId: string, input: UpdateStepInput) => Promise<void>;
  reorderSteps: (stepIds: string[]) => Promise<void>;

  // Editing mode
  startEditing: () => void;
  stopEditing: () => void;

  // Presentation mode
  startPresentation: (walk: Walk) => void;
  stopPresentation: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
}
```

### Phase 3: Frontend - UI Components

#### 3.1 WalkPanel (`client/src/components/Walk/WalkPanel.tsx`)
Right-side panel for walk management (similar to TagSidebar pattern)

**Features:**
- Walk list with create/delete/select
- Current walk step list (draggable for reorder)
- "Add to walk" mode indicator
- Step annotation preview
- Play button to start presentation

**Layout:**
```
┌─────────────────────────────┐
│ Walks                    ✕  │
├─────────────────────────────┤
│ [+ New Walk]                │
│                             │
│ ▼ My First Walk            │
│   1. Introduction Node      │
│   2. Main Concept           │
│   3. Supporting Evidence    │
│   [▶ Present] [✎ Edit]     │
│                             │
│ ▶ Another Walk              │
│ ▶ Third Walk                │
├─────────────────────────────┤
│ Click nodes to add steps    │
│ when in edit mode           │
└─────────────────────────────┘
```

#### 3.2 WalkPresentation (`client/src/components/Walk/WalkPresentation.tsx`)
Full-screen presentation overlay

**Features:**
- Smooth Prezi-style zoom animations (800ms duration)
- Current step annotation displayed at bottom
- Progress indicator (step X of Y)
- Navigation: arrows, keyboard (←/→, Escape)
- Semi-transparent controls that fade

**Layout:**
```
┌────────────────────────────────────────────┐
│                                        [✕] │
│                                            │
│           [ZOOMED NODE VIEW]               │
│                                            │
│                                            │
│  [←]                                  [→]  │
│                                            │
├────────────────────────────────────────────┤
│ Step 2 of 5: Main Concept                  │
│ ─────────────────────────────────────────  │
│ This node explains the core idea behind    │
│ the theory. Notice how it connects to...   │
│                                            │
│ ○ ○ ● ○ ○                                  │
└────────────────────────────────────────────┘
```

#### 3.3 WalkStepEditor (`client/src/components/Walk/WalkStepEditor.tsx`)
Modal for editing step annotation

**Features:**
- TipTap editor for rich text annotation
- Zoom level slider (0.5x - 3x)
- Optional auto-advance duration
- Preview of target node

### Phase 4: Canvas Integration

#### 4.1 Walk Mode in ConceptMapCanvas
```typescript
// In ConceptMapCanvas.tsx
const { isEditing, addStep, currentWalk } = useWalkStore();

// Node click handler modification
const handleNodeClick = (nodeId: string) => {
  if (isEditing && currentWalk) {
    addStep(nodeId);
    return; // Don't open editor
  }
  // Normal behavior...
};

// Visual indicator for nodes in current walk
const getNodeClassName = (nodeId: string) => {
  if (currentWalk?.steps.some(s => s.nodeId === nodeId)) {
    const stepIndex = currentWalk.steps.findIndex(s => s.nodeId === nodeId);
    return `in-walk step-${stepIndex + 1}`;
  }
  return '';
};
```

#### 4.2 Walk Toolbar Button
```typescript
// Add to canvas toolbar
<button
  className={`toolbar-button ${walkPanelOpen ? 'active' : ''}`}
  onClick={() => setWalkPanelOpen(!walkPanelOpen)}
  title="Walks"
>
  🚶
</button>
```

### Phase 5: Presentation Animation Engine

#### 5.1 Viewport Animation
Using React Flow's setCenter with custom easing:

```typescript
const animateToStep = async (step: WalkStep) => {
  const node = getNode(step.nodeId);
  if (!node) return;

  const centerX = node.position.x + (node.width || 150) / 2;
  const centerY = node.position.y + (node.height || 60) / 2;

  // Smooth zoom animation
  await setCenter(centerX, centerY, {
    zoom: step.zoomLevel || 1.5,
    duration: 800  // Prezi-style smooth transition
  });
};
```

#### 5.2 Keyboard Controls in Presentation
```typescript
useEffect(() => {
  if (!isPresenting) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
        nextStep();
        break;
      case 'ArrowLeft':
        prevStep();
        break;
      case 'Escape':
        stopPresentation();
        break;
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isPresenting, nextStep, prevStep, stopPresentation]);
```

## Visual Design

### Walk Panel Styling
- Right-side drawer (320px width, same as TagSidebar)
- Slide-in animation from right
- Z-index: 1000 (same level as other panels)
- Dark mode support

### Presentation Mode Styling
- Full viewport overlay (z-index: 2000)
- Semi-transparent dark background (rgba(0,0,0,0.85))
- Annotation panel at bottom (max-height: 30vh)
- Smooth fade-in/out for controls
- Progress dots with current step highlighted

### Node Walk Indicators
- Badge showing step number on nodes in current walk
- Subtle highlight/border for walk nodes when editing
- Different color for current step vs other steps

## Vim Integration (Optional Enhancement)

```typescript
// New vim commands
'gW' - Open walk panel
':walk' - Start presentation of current walk
':walk new <name>' - Create new walk
'ga' - Add focused node to current walk (when editing)
'gr' - Remove focused node from current walk
```

## Edge Cases

1. **Deleted nodes**: Remove steps referencing deleted nodes, show warning
2. **Empty walk**: Disable play button, show "Add nodes" prompt
3. **Single step**: Still allow presentation (just zoom to that node)
4. **Node in multiple walks**: Supported, each walk independent
5. **Concurrent editing**: Last write wins (no real-time collaboration)
6. **Large annotations**: Scrollable annotation panel, max 1000 chars

## Migration

### Database Migration (`node-service/migrations/002_add_walks.sql`)
```sql
CREATE TABLE walks (
  id TEXT PRIMARY KEY,
  conceptMapId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conceptMapId) REFERENCES concept_maps(id) ON DELETE CASCADE
);

CREATE TABLE walk_steps (
  id TEXT PRIMARY KEY,
  walkId TEXT NOT NULL,
  nodeId TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  annotation TEXT,
  zoomLevel REAL DEFAULT 1.5,
  duration INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (walkId) REFERENCES walks(id) ON DELETE CASCADE,
  FOREIGN KEY (nodeId) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE INDEX idx_walks_conceptMapId ON walks(conceptMapId);
CREATE INDEX idx_walk_steps_walkId ON walk_steps(walkId);
CREATE INDEX idx_walk_steps_nodeId ON walk_steps(nodeId);
```

## Implementation Order

1. **Backend entities and migration** (Walk.ts, migration SQL)
2. **Backend service and controller** (walk.service.ts, walk.controller.ts)
3. **API Gateway proxy** (add /walks routes)
4. **Frontend types and API client** (walk.ts types, walk.api.ts)
5. **Walk store** (walkStore.ts)
6. **WalkPanel component** (list/create/edit walks)
7. **Canvas integration** (toolbar button, node click handling)
8. **WalkStepEditor** (annotation editing)
9. **WalkPresentation** (presentation mode with animations)
10. **Polish** (keyboard shortcuts, visual refinements)

## Testing Considerations

- Unit tests for walk service CRUD operations
- Integration tests for step reordering
- E2E tests for presentation flow
- Edge case tests for deleted nodes
- Animation timing tests
- Keyboard navigation tests
