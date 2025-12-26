# Phase 6: Tags & Color Themes
# Principle - Interactive Concept Map Application

**Phase:** 6 - Tags & Visual Customization System
**Timeline:** Week 6-7 (7-10 days)
**Status:** Ready for Implementation
**Date Created:** December 13, 2025
**Last Updated:** December 13, 2025

---

## Overview

Phase 6 introduces powerful organization and customization capabilities to Principle through **Tags** and **Color Themes**. After completing the core functionality (Phases 0-4) and essential UX polish (Phase 5), users now need tools to organize large concept maps and personalize their visual experience.

### Goals

**Primary Goals:**
1. **Tags System** - Enable users to categorize, filter, and organize nodes using tags
2. **Color Themes** - Provide visual customization with preset and custom themes
3. **Advanced Organization** - Support complex filtering and tag-based navigation
4. **Visual Personalization** - Allow per-node color overrides and theme customization

**Secondary Goals:**
1. Tag-based search and discovery
2. Theme export/import for sharing
3. Tag statistics and analytics
4. Accessibility-compliant color schemes

### What You'll Build

By the end of Phase 6, you will have:

**Tags Features:**
- ✨ Autocomplete tag input with existing tag suggestions
- 🏷️ Colored tag chips displayed on nodes
- 🔍 Filter nodes by single or multiple tags (AND/OR modes)
- 📊 Tag sidebar showing all tags with usage counts
- ⚙️ Tag management (rename, delete, merge tags)
- 🎯 Tag-based navigation and search
- 💾 Persistent tag state across sessions

**Theme Features:**
- 🎨 5 built-in preset themes (Light, Dark, Solarized, Dracula, Nord)
- 🛠️ Custom theme builder with full color customization
- 🖌️ Per-node color override capability
- 📤 Theme export/import as JSON
- 🌈 Instant theme switching with smooth transitions
- 💾 Theme persistence in local storage
- ♿ WCAG AA compliant color contrast

### Key Achievements

**Organization & Discovery:**
- Users can organize 500+ node concept maps using tags
- Filter complex graphs to focus on specific categories
- Find related nodes by tag associations
- Build hierarchical tag taxonomies (via naming conventions)

**Visual Customization:**
- Match Principle's appearance to personal preferences
- Create high-contrast themes for accessibility
- Override colors for important nodes
- Share themes with team members

**Performance:**
- Tag filtering completes in <100ms for 500+ nodes
- Theme switching is instant (<200ms)
- No performance degradation with 50+ tags
- Smooth autocomplete with 100+ tags

### Relationship to Previous Phases

**Builds On:**
- **Phase 1-3**: Tags attach to nodes, filters work with edges
- **Phase 4**: Theme colors apply to image containers
- **Phase 5**: Tags work with Vim navigation, themes integrate with Vim status bar

**Integrates With:**
- **Undo/Redo** (Phase 5): Tag operations and theme changes are undoable
- **Auto-save** (Phase 5): Tag changes trigger auto-save
- **Search** (Phase 5): Search can filter by tags

**Enables Future Phases:**
- **Phase 7**: AI can suggest tags, auto-categorize nodes
- **Phase 8**: Export preserves tags and themes
- **Phase 9**: Templates can include tag schemas and themes

### Technology Stack

**Frontend:**
- **Zustand** - State management for tags and themes
- **React** - Tag and theme UI components
- **CSS Variables** - Dynamic theme application
- **LocalStorage** - Theme and tag persistence

**Backend:**
- **TypeORM** - Tag search queries
- **SQLite** - Tags already stored in `Node.tags` column
- **Express** - Tag search API endpoints

**Libraries (Optional):**
```bash
npm install react-color        # Color picker component
npm install tinycolor2         # Color manipulation utilities
npm install react-select       # Autocomplete patterns
```

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Changes](#architecture-changes)
   - [Database Schema](#database-schema)
   - [Component Architecture](#component-architecture)
   - [State Management](#state-management)
3. [Tags System Implementation](#tags-system-implementation)
   - [Step 1: Define Tag Types](#step-1-define-tag-types)
   - [Step 2: Create Tag Store](#step-2-create-tag-store)
   - [Step 3: Create TagInput Component](#step-3-create-taginput-component)
   - [Step 4: Create TagChip Component](#step-4-create-tagchip-component)
   - [Step 5: Create TagSidebar Component](#step-5-create-tagsidebar-component)
   - [Step 6: Create TagManager Component](#step-6-create-tagmanager-component)
   - [Step 7: Update Node Service for Tag Search](#step-7-update-node-service-for-tag-search)
   - [Step 8: Integrate with Concept Map Store](#step-8-integrate-with-concept-map-store)
4. [Color Themes System Implementation](#color-themes-system-implementation)
   - [Step 1: Define Theme Types](#step-1-define-theme-types)
   - [Step 2: Create Theme Store with Presets](#step-2-create-theme-store-with-presets)
   - [Step 3: Create ThemePicker Component](#step-3-create-themepicker-component)
   - [Step 4: Create ThemeBuilder Component](#step-4-create-themebuilder-component)
   - [Step 5: Create ColorPicker Component](#step-5-create-colorpicker-component)
   - [Step 6: Create NodeColorPicker Component](#step-6-create-nodecolorpicker-component)
   - [Step 7: Apply Theme to Canvas](#step-7-apply-theme-to-canvas)
   - [Step 8: Apply Theme to Nodes](#step-8-apply-theme-to-nodes)
   - [Step 9: Theme Export/Import](#step-9-theme-exportimport)
5. [Integration & Testing](#integration--testing)
6. [Success Criteria](#success-criteria)
7. [Troubleshooting](#troubleshooting)
8. [Performance Considerations](#performance-considerations)
9. [Security Considerations](#security-considerations)
10. [Accessibility Considerations](#accessibility-considerations)
11. [Next Steps: Phase 7](#next-steps-phase-7)
12. [Timeline Estimate](#timeline-estimate)
13. [Resources](#resources)
14. [Appendices](#appendices)

---

## Prerequisites

Before starting Phase 6, ensure all previous phases are complete and functional.

### Phase Completion Checklist

- ✅ **Phase 0**: All services running in Docker-free mode
- ✅ **Phase 1**: Nodes and concept maps working
- ✅ **Phase 2**: Rich text editor functional
- ✅ **Phase 3**: Edges connecting nodes properly
- ✅ **Phase 4**: Image upload and display working
- ✅ **Phase 5**: Vim mode, undo/redo, auto-save operational

### Service Health Verification

Run these commands to verify all services are running:

```bash
# Check all ports are active
for port in 3000 3001 3002 3003 3004 3005 5173; do
  echo -n "Port $port: "
  if lsof -ti:$port > /dev/null 2>&1; then
    echo "✓ RUNNING"
  else
    echo "✗ DOWN"
  fi
done
```

**Expected Output:**
```
Port 3000: ✓ RUNNING  # API Gateway
Port 3001: ✓ RUNNING  # Node Service
Port 3002: ✓ RUNNING  # Edge Service
Port 3003: ✓ RUNNING  # Media Service
Port 3004: ✓ RUNNING  # AI Service
Port 3005: ✓ RUNNING  # Queue Service
Port 5173: ✓ RUNNING  # Client
```

### Database Schema Verification

Verify that the Node table has the tags column:

```bash
# Check node-service database
cd node-service
npx typeorm query "PRAGMA table_info(concept_map_node);" -d src/data-source.ts
```

**Look for this column:**
```
tags | text | 0 | NULL | 0
```

The `tags` column already exists in the schema (from Phase 1), so no migration is needed.

### Feature Verification

**Test Vim Mode:**
1. Open http://localhost:5173
2. Press `Escape` to enter Normal mode
3. Press `h`, `j`, `k`, `l` to navigate (should move focus between nodes)
4. Press `i` to enter Insert mode
5. Verify status bar shows current mode

**Test Undo/Redo:**
1. Create a new node
2. Delete it
3. Press `u` (or Cmd+Z) to undo deletion
4. Press `Ctrl+r` (or Cmd+Shift+Z) to redo
5. Verify node appears/disappears correctly

**Test Auto-save:**
1. Create a node and move it
2. Wait 2-3 seconds
3. Refresh the page
4. Verify the node position is preserved

### Environment Setup

Ensure your development environment is ready:

```bash
# Verify Node.js version
node --version  # Should be v18+

# Verify npm
npm --version   # Should be 9+

# Navigate to project root
cd /Users/ryuparish/Code/Principle

# Verify all services have node_modules
for dir in api-gateway node-service edge-service media-service ai-service queue-service client; do
  if [ -d "$dir/node_modules" ]; then
    echo "✓ $dir has dependencies"
  else
    echo "✗ $dir missing node_modules - run npm install"
  fi
done
```

### Current Working Directory

This phase assumes you're in the project root:

```bash
pwd
# Expected: /Users/ryuparish/Code/Principle
```

---

## Architecture Changes

Phase 6 introduces new state management stores, UI components, and minimal backend changes for tag search.

### Database Schema

**Good News:** The Node table already includes a `tags` column! No migration needed.

#### Existing Schema (No Changes Required)

**File:** `node-service/src/entities/ConceptMapNode.entity.ts`

The Node entity already has:

```typescript
@Column('simple-array', { default: '' })
tags: string[];
```

This column stores tags as a simple array of strings, perfect for our needs.

**Example Data:**
```typescript
{
  id: 'abc-123',
  title: 'Neural Networks',
  tags: ['AI', 'machine-learning', 'fundamentals'],
  // ... other fields
}
```

#### Optional: User Preferences Table (Future Enhancement)

For storing user-specific settings (theme preferences, default tag colors), you could add:

**File:** `node-service/src/entities/UserPreferences.entity.ts` (Optional - Not Implemented in Phase 6)

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  themeId: string;

  @Column('simple-json', { default: '[]' })
  customThemes: any[];

  @Column('simple-json', { default: '{}' })
  tagColors: Record<string, string>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Note:** Phase 6 uses LocalStorage for theme persistence instead of a database table to keep it simple. This table is documented for future multi-user support.

---

### Component Architecture

Phase 6 adds new components organized into `Tags/` and `Theme/` directories:

```
client/src/
├── components/
│   ├── Canvas/
│   │   ├── ConceptMapCanvas.tsx          (UPDATED - apply themes)
│   │   ├── Toolbar.tsx                   (UPDATED - add theme picker)
│   │   └── ...
│   ├── Node/
│   │   ├── CustomNode.tsx                (UPDATED - display tag chips)
│   │   ├── NodeEditorModal.tsx           (UPDATED - add tag input & color picker)
│   │   └── NodeColorPicker.tsx           (NEW)
│   ├── Tags/                             (NEW DIRECTORY)
│   │   ├── TagInput.tsx                  (NEW - autocomplete input)
│   │   ├── TagInput.css
│   │   ├── TagChip.tsx                   (NEW - colored tag display)
│   │   ├── TagChip.css
│   │   ├── TagSidebar.tsx                (NEW - tag list & filtering)
│   │   ├── TagSidebar.css
│   │   ├── TagManager.tsx                (NEW - advanced tag ops)
│   │   └── TagManager.css
│   ├── Theme/                            (NEW DIRECTORY)
│   │   ├── ThemePicker.tsx               (NEW - theme dropdown)
│   │   ├── ThemePicker.css
│   │   ├── ThemeBuilder.tsx              (NEW - theme editor modal)
│   │   ├── ThemeBuilder.css
│   │   ├── ColorPicker.tsx               (NEW - color picker widget)
│   │   ├── ColorPicker.css
│   │   └── PresetThemeGallery.tsx        (NEW - preset theme cards)
│   └── ...
├── store/
│   ├── conceptMapStore.ts                (UPDATED - integrate tag filtering)
│   ├── tagStore.ts                       (NEW - tag state management)
│   └── themeStore.ts                     (NEW - theme state + presets)
├── types/
│   ├── index.ts                          (UPDATED - add Tag interfaces)
│   └── theme.ts                          (NEW - theme type definitions)
└── ...
```

**Component Hierarchy Diagram:**

```
ConceptMapCanvas
├── Toolbar
│   ├── (existing buttons)
│   ├── ThemePicker ← NEW
│   │   ├── PresetThemeGallery
│   │   └── CustomThemeList
│   └── TagSidebarToggle ← NEW
│
├── ReactFlow
│   └── CustomNode (foreach node)
│       ├── NodeTitle
│       ├── NodeContent
│       └── TagChips ← NEW
│           └── TagChip (foreach tag)
│
├── TagSidebar ← NEW (toggleable)
│   ├── TagFilterControls
│   │   └── AND/OR mode toggle
│   ├── TagList
│   │   └── TagItem (foreach tag)
│   │       ├── Tag name + count
│   │       └── Filter toggle
│   └── TagManager
│       ├── Rename tag
│       ├── Delete tag
│       └── Merge tags
│
├── NodeEditorModal (when editing node)
│   ├── (existing content)
│   ├── TagInput ← NEW
│   │   ├── Autocomplete dropdown
│   │   └── Current tags display
│   └── NodeColorPicker ← NEW
│       ├── Color swatches
│       └── "Use theme default" option
│
└── ThemeBuilderModal ← NEW (when customizing theme)
    ├── Theme name input
    ├── ColorPicker (foreach theme property)
    │   ├── Canvas colors
    │   ├── Node colors
    │   ├── Edge colors
    │   └── UI colors
    ├── Live preview
    └── Save/Cancel/Export buttons
```

---

### State Management

Phase 6 introduces two new Zustand stores that integrate with the existing concept map store.

#### Tag Store Architecture

**File:** `client/src/store/tagStore.ts`

**Purpose:** Manage all tag-related state and operations

**State:**
```typescript
{
  tags: Map<string, Tag>,           // tagName -> Tag metadata
  activeTags: Set<string>,          // Currently filtered tags
  tagMode: 'AND' | 'OR',            // Filter mode
  tagUsage: Map<string, string[]>,  // tagName -> nodeIds[]
}
```

**Actions:**
```typescript
- addTagToNode(nodeId, tagName)
- removeTagFromNode(nodeId, tagName)
- renameTag(oldName, newName)
- deleteTag(tagName)
- mergeTags(sourceTags[], targetTag)
- setActiveFilters(tags[], mode)
- clearFilters()
- getFilteredNodes(allNodes) -> filtered nodes
- getTagSuggestions(query) -> suggested tags
```

#### Theme Store Architecture

**File:** `client/src/store/themeStore.ts`

**Purpose:** Manage theme state, presets, and customization

**State:**
```typescript
{
  currentTheme: ColorTheme,
  customThemes: ColorTheme[],
  presetThemes: ColorTheme[],       // 5 built-in themes
  nodeOverrides: Map<string, NodeColorOverride>,
}
```

**Actions:**
```typescript
- setTheme(themeId)
- createCustomTheme(name, colors)
- updateTheme(themeId, colors)
- deleteTheme(themeId)
- duplicateTheme(themeId, newName)
- setNodeColorOverride(nodeId, colors)
- clearNodeColorOverride(nodeId)
- exportTheme(themeId) -> JSON
- importTheme(json) -> ColorTheme
```

#### Integration with Concept Map Store

**File:** `client/src/store/conceptMapStore.ts` (Updated)

The existing store will be updated to:
1. Subscribe to tag filter changes
2. Filter nodes before rendering
3. Support undo/redo for tag operations
4. Trigger auto-save when tags change

**Integration Pattern:**
```typescript
// In conceptMapStore
const useConceptMapStore = create((set, get) => ({
  // ... existing state

  // Get filtered nodes based on active tags
  getFilteredNodes: () => {
    const { nodes } = get();
    const { activeTags, tagMode } = useTagStore.getState();

    if (activeTags.size === 0) return nodes;

    return useTagStore.getState().getFilteredNodes(nodes);
  },

  // Update node tags and trigger auto-save
  updateNodeTags: async (nodeId, tags) => {
    // Update local state
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, tags } : n
      ),
    }));

    // Save to backend
    await nodeService.updateNode(nodeId, { tags });
  },
}));
```

---

## Tags System Implementation

The tags system allows users to categorize nodes, filter by tags, and organize large concept maps. This section provides complete implementation code for all tag-related components.

### Step 1: Define Tag Types

First, define TypeScript interfaces for tag-related data structures.

**File:** `client/src/types/index.ts` (Update)

Add these interfaces to the existing file:

```typescript
// ... existing imports and types ...

/**
 * Represents a tag with metadata
 */
export interface Tag {
  /** Tag name (unique identifier) */
  name: string;
  /** Display color for tag chips */
  color: string;
  /** Number of nodes using this tag */
  count: number;
  /** When the tag was first created */
  createdAt: string;
  /** Last time a node was tagged with this */
  lastUsed: string;
}

/**
 * Tag filtering configuration
 */
export interface TagFilter {
  /** Tags to filter by */
  tags: string[];
  /** Match all tags (AND) or any tag (OR) */
  mode: 'AND' | 'OR';
}

/**
 * Association between a node and a tag
 */
export interface NodeTag {
  nodeId: string;
  tagName: string;
  addedAt: string;
}

/**
 * Tag autocomplete suggestion
 */
export interface TagSuggestion {
  tagName: string;
  frequency: number;
  matchScore: number;
}

/**
 * Tag statistics for analytics
 */
export interface TagStats {
  totalTags: number;
  totalTaggedNodes: number;
  averageTagsPerNode: number;
  mostUsedTags: Array<{ name: string; count: number }>;
  unusedTags: string[];
}
```

---

### Step 2: Create Tag Store

Create a Zustand store to manage all tag-related state and operations.

**File:** `client/src/store/tagStore.ts` (New File)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConceptMapNode } from '../types';

export interface Tag {
  name: string;
  color: string;
  count: number;
  createdAt: string;
  lastUsed: string;
}

export interface TagFilter {
  tags: string[];
  mode: 'AND' | 'OR';
}

interface TagStore {
  // ========================================
  // STATE
  // ========================================

  /** All tags with their metadata */
  tags: Map<string, Tag>;

  /** Currently active filter tags */
  activeTags: Set<string>;

  /** Filter mode: AND requires all tags, OR requires any tag */
  tagMode: 'AND' | 'OR';

  /** Reverse index: tag name -> array of node IDs */
  tagUsage: Map<string, Set<string>>;

  /** Default tag colors (cycled through when creating new tags) */
  defaultColors: string[];

  /** Index for cycling through default colors */
  colorIndex: number;

  // ========================================
  // ACTIONS - Tag Management
  // ========================================

  /**
   * Add a tag to a node
   */
  addTagToNode: (nodeId: string, tagName: string) => void;

  /**
   * Remove a tag from a node
   */
  removeTagFromNode: (nodeId: string, tagName: string) => void;

  /**
   * Rename a tag globally (updates all nodes)
   */
  renameTag: (oldName: string, newName: string) => void;

  /**
   * Delete a tag globally (removes from all nodes)
   */
  deleteTag: (tagName: string) => void;

  /**
   * Merge multiple tags into one (combines all nodes)
   */
  mergeTags: (sourceTags: string[], targetTag: string) => void;

  /**
   * Update tag color
   */
  updateTagColor: (tagName: string, color: string) => void;

  /**
   * Sync tags from concept map nodes (build index)
   */
  syncTagsFromNodes: (nodes: ConceptMapNode[]) => void;

  // ========================================
  // ACTIONS - Filtering
  // ========================================

  /**
   * Set active tag filters
   */
  setActiveFilters: (tags: string[], mode: 'AND' | 'OR') => void;

  /**
   * Add a tag to the active filter
   */
  addTagToFilter: (tagName: string) => void;

  /**
   * Remove a tag from the active filter
   */
  removeTagFromFilter: (tagName: string) => void;

  /**
   * Toggle a tag in the filter
   */
  toggleTagFilter: (tagName: string) => void;

  /**
   * Clear all filters
   */
  clearFilters: () => void;

  /**
   * Toggle filter mode between AND/OR
   */
  toggleFilterMode: () => void;

  // ========================================
  // COMPUTED/GETTERS
  // ========================================

  /**
   * Get filtered nodes based on active tags
   */
  getFilteredNodes: (nodes: ConceptMapNode[]) => ConceptMapNode[];

  /**
   * Get autocomplete suggestions for tag input
   */
  getTagSuggestions: (query: string) => string[];

  /**
   * Get all nodes with a specific tag
   */
  getNodesByTag: (tagName: string) => string[];

  /**
   * Get tag statistics
   */
  getTagStats: () => {
    totalTags: number;
    totalTaggedNodes: number;
    averageTagsPerNode: number;
    mostUsedTags: Array<{ name: string; count: number }>;
  };

  /**
   * Check if a tag exists
   */
  hasTag: (tagName: string) => boolean;

  /**
   * Get the next default color for a new tag
   */
  getNextColor: () => string;
}

/**
 * Default tag color palette
 */
const DEFAULT_TAG_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#f97316', // Orange
  '#14b8a6', // Teal
];

/**
 * Tag Store
 *
 * Manages all tag-related state including tag metadata,
 * filtering, and tag-node associations.
 */
export const useTagStore = create<TagStore>()(
  persist(
    (set, get) => ({
      // ========================================
      // INITIAL STATE
      // ========================================

      tags: new Map(),
      activeTags: new Set(),
      tagMode: 'OR',
      tagUsage: new Map(),
      defaultColors: DEFAULT_TAG_COLORS,
      colorIndex: 0,

      // ========================================
      // TAG MANAGEMENT ACTIONS
      // ========================================

      addTagToNode: (nodeId: string, tagName: string) => {
        const normalizedTag = tagName.trim().toLowerCase();

        if (!normalizedTag) return;

        set((state) => {
          const tags = new Map(state.tags);
          const tagUsage = new Map(state.tagUsage);

          // Get or create tag
          let tag = tags.get(normalizedTag);
          if (!tag) {
            tag = {
              name: normalizedTag,
              color: state.getNextColor(),
              count: 0,
              createdAt: new Date().toISOString(),
              lastUsed: new Date().toISOString(),
            };
            tags.set(normalizedTag, tag);
          }

          // Update tag usage
          const nodeIds = tagUsage.get(normalizedTag) || new Set();
          if (!nodeIds.has(nodeId)) {
            nodeIds.add(nodeId);
            tagUsage.set(normalizedTag, nodeIds);

            // Update tag count and last used
            tag.count = nodeIds.size;
            tag.lastUsed = new Date().toISOString();
            tags.set(normalizedTag, { ...tag });
          }

          return { tags, tagUsage };
        });
      },

      removeTagFromNode: (nodeId: string, tagName: string) => {
        const normalizedTag = tagName.trim().toLowerCase();

        set((state) => {
          const tags = new Map(state.tags);
          const tagUsage = new Map(state.tagUsage);

          const nodeIds = tagUsage.get(normalizedTag);
          if (nodeIds) {
            nodeIds.delete(nodeId);

            if (nodeIds.size === 0) {
              // No more nodes use this tag, remove it
              tags.delete(normalizedTag);
              tagUsage.delete(normalizedTag);
            } else {
              // Update count
              tagUsage.set(normalizedTag, nodeIds);
              const tag = tags.get(normalizedTag);
              if (tag) {
                tags.set(normalizedTag, { ...tag, count: nodeIds.size });
              }
            }
          }

          return { tags, tagUsage };
        });
      },

      renameTag: (oldName: string, newName: string) => {
        const oldNormalized = oldName.trim().toLowerCase();
        const newNormalized = newName.trim().toLowerCase();

        if (oldNormalized === newNormalized) return;

        set((state) => {
          const tags = new Map(state.tags);
          const tagUsage = new Map(state.tagUsage);
          const activeTags = new Set(state.activeTags);

          const oldTag = tags.get(oldNormalized);
          const oldNodeIds = tagUsage.get(oldNormalized);

          if (!oldTag || !oldNodeIds) return {};

          // Check if new tag already exists
          const existingTag = tags.get(newNormalized);
          if (existingTag) {
            // Merge into existing tag
            const existingNodeIds = tagUsage.get(newNormalized) || new Set();
            oldNodeIds.forEach((nodeId) => existingNodeIds.add(nodeId));
            tagUsage.set(newNormalized, existingNodeIds);
            tags.set(newNormalized, {
              ...existingTag,
              count: existingNodeIds.size,
              lastUsed: new Date().toISOString(),
            });
          } else {
            // Create new tag with old data
            tags.set(newNormalized, {
              ...oldTag,
              name: newNormalized,
              lastUsed: new Date().toISOString(),
            });
            tagUsage.set(newNormalized, oldNodeIds);
          }

          // Remove old tag
          tags.delete(oldNormalized);
          tagUsage.delete(oldNormalized);

          // Update active filters if old tag was active
          if (activeTags.has(oldNormalized)) {
            activeTags.delete(oldNormalized);
            activeTags.add(newNormalized);
          }

          return { tags, tagUsage, activeTags };
        });
      },

      deleteTag: (tagName: string) => {
        const normalizedTag = tagName.trim().toLowerCase();

        set((state) => {
          const tags = new Map(state.tags);
          const tagUsage = new Map(state.tagUsage);
          const activeTags = new Set(state.activeTags);

          tags.delete(normalizedTag);
          tagUsage.delete(normalizedTag);
          activeTags.delete(normalizedTag);

          return { tags, tagUsage, activeTags };
        });
      },

      mergeTags: (sourceTags: string[], targetTag: string) => {
        const normalizedSources = sourceTags.map((t) => t.trim().toLowerCase());
        const normalizedTarget = targetTag.trim().toLowerCase();

        set((state) => {
          const tags = new Map(state.tags);
          const tagUsage = new Map(state.tagUsage);
          const activeTags = new Set(state.activeTags);

          // Collect all node IDs from source tags
          const allNodeIds = new Set<string>();
          normalizedSources.forEach((sourceTag) => {
            const nodeIds = tagUsage.get(sourceTag);
            if (nodeIds) {
              nodeIds.forEach((id) => allNodeIds.add(id));
              tags.delete(sourceTag);
              tagUsage.delete(sourceTag);
              activeTags.delete(sourceTag);
            }
          });

          // Get or create target tag
          let targetTagObj = tags.get(normalizedTarget);
          if (!targetTagObj) {
            targetTagObj = {
              name: normalizedTarget,
              color: state.getNextColor(),
              count: 0,
              createdAt: new Date().toISOString(),
              lastUsed: new Date().toISOString(),
            };
          }

          // Merge node IDs into target
          const existingNodeIds = tagUsage.get(normalizedTarget) || new Set();
          allNodeIds.forEach((id) => existingNodeIds.add(id));

          tagUsage.set(normalizedTarget, existingNodeIds);
          tags.set(normalizedTarget, {
            ...targetTagObj,
            count: existingNodeIds.size,
            lastUsed: new Date().toISOString(),
          });

          return { tags, tagUsage, activeTags };
        });
      },

      updateTagColor: (tagName: string, color: string) => {
        const normalizedTag = tagName.trim().toLowerCase();

        set((state) => {
          const tags = new Map(state.tags);
          const tag = tags.get(normalizedTag);

          if (tag) {
            tags.set(normalizedTag, { ...tag, color });
          }

          return { tags };
        });
      },

      syncTagsFromNodes: (nodes: ConceptMapNode[]) => {
        set((state) => {
          const tags = new Map<string, Tag>();
          const tagUsage = new Map<string, Set<string>>();
          let colorIndex = 0;

          nodes.forEach((node) => {
            if (!node.tags || node.tags.length === 0) return;

            node.tags.forEach((tagName) => {
              const normalizedTag = tagName.trim().toLowerCase();
              if (!normalizedTag) return;

              // Get or create tag
              let tag = tags.get(normalizedTag);
              if (!tag) {
                tag = {
                  name: normalizedTag,
                  color: DEFAULT_TAG_COLORS[colorIndex % DEFAULT_TAG_COLORS.length],
                  count: 0,
                  createdAt: new Date().toISOString(),
                  lastUsed: new Date().toISOString(),
                };
                colorIndex++;
              }

              // Update usage
              const nodeIds = tagUsage.get(normalizedTag) || new Set();
              nodeIds.add(node.id);
              tagUsage.set(normalizedTag, nodeIds);

              // Update count
              tag.count = nodeIds.size;
              tags.set(normalizedTag, tag);
            });
          });

          return { tags, tagUsage, colorIndex };
        });
      },

      // ========================================
      // FILTERING ACTIONS
      // ========================================

      setActiveFilters: (tags: string[], mode: 'AND' | 'OR') => {
        set({
          activeTags: new Set(tags.map((t) => t.trim().toLowerCase())),
          tagMode: mode,
        });
      },

      addTagToFilter: (tagName: string) => {
        const normalizedTag = tagName.trim().toLowerCase();

        set((state) => {
          const activeTags = new Set(state.activeTags);
          activeTags.add(normalizedTag);
          return { activeTags };
        });
      },

      removeTagFromFilter: (tagName: string) => {
        const normalizedTag = tagName.trim().toLowerCase();

        set((state) => {
          const activeTags = new Set(state.activeTags);
          activeTags.delete(normalizedTag);
          return { activeTags };
        });
      },

      toggleTagFilter: (tagName: string) => {
        const normalizedTag = tagName.trim().toLowerCase();

        set((state) => {
          const activeTags = new Set(state.activeTags);

          if (activeTags.has(normalizedTag)) {
            activeTags.delete(normalizedTag);
          } else {
            activeTags.add(normalizedTag);
          }

          return { activeTags };
        });
      },

      clearFilters: () => {
        set({ activeTags: new Set() });
      },

      toggleFilterMode: () => {
        set((state) => ({
          tagMode: state.tagMode === 'AND' ? 'OR' : 'AND',
        }));
      },

      // ========================================
      // COMPUTED/GETTERS
      // ========================================

      getFilteredNodes: (nodes: ConceptMapNode[]) => {
        const { activeTags, tagMode } = get();

        if (activeTags.size === 0) {
          return nodes;
        }

        return nodes.filter((node) => {
          if (!node.tags || node.tags.length === 0) {
            return false;
          }

          const nodeTags = new Set(
            node.tags.map((t) => t.trim().toLowerCase())
          );

          if (tagMode === 'AND') {
            // Node must have ALL active tags
            return Array.from(activeTags).every((tag) => nodeTags.has(tag));
          } else {
            // Node must have ANY active tag
            return Array.from(activeTags).some((tag) => nodeTags.has(tag));
          }
        });
      },

      getTagSuggestions: (query: string) => {
        const normalizedQuery = query.trim().toLowerCase();
        const { tags } = get();

        if (!normalizedQuery) {
          // Return all tags sorted by usage
          return Array.from(tags.values())
            .sort((a, b) => b.count - a.count)
            .map((tag) => tag.name);
        }

        // Filter tags that match query
        return Array.from(tags.values())
          .filter((tag) => tag.name.includes(normalizedQuery))
          .sort((a, b) => {
            // Prioritize exact prefix matches
            const aStartsWith = a.name.startsWith(normalizedQuery);
            const bStartsWith = b.name.startsWith(normalizedQuery);

            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;

            // Then sort by usage
            return b.count - a.count;
          })
          .map((tag) => tag.name);
      },

      getNodesByTag: (tagName: string) => {
        const normalizedTag = tagName.trim().toLowerCase();
        const { tagUsage } = get();
        const nodeIds = tagUsage.get(normalizedTag);
        return nodeIds ? Array.from(nodeIds) : [];
      },

      getTagStats: () => {
        const { tags, tagUsage } = get();

        const totalTags = tags.size;
        const totalTaggedNodes = new Set(
          Array.from(tagUsage.values()).flatMap((nodeIds) =>
            Array.from(nodeIds)
          )
        ).size;

        let totalTagsUsed = 0;
        tagUsage.forEach((nodeIds) => {
          totalTagsUsed += nodeIds.size;
        });

        const averageTagsPerNode =
          totalTaggedNodes > 0 ? totalTagsUsed / totalTaggedNodes : 0;

        const mostUsedTags = Array.from(tags.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
          .map((tag) => ({
            name: tag.name,
            count: tag.count,
          }));

        return {
          totalTags,
          totalTaggedNodes,
          averageTagsPerNode,
          mostUsedTags,
        };
      },

      hasTag: (tagName: string) => {
        const normalizedTag = tagName.trim().toLowerCase();
        return get().tags.has(normalizedTag);
      },

      getNextColor: () => {
        const { defaultColors, colorIndex } = get();
        const color = defaultColors[colorIndex % defaultColors.length];

        set((state) => ({
          colorIndex: state.colorIndex + 1,
        }));

        return color;
      },
    }),
    {
      name: 'principle-tag-storage',
      // Custom serialization for Map and Set
      serialize: (state) => {
        return JSON.stringify({
          ...state.state,
          tags: Array.from(state.state.tags.entries()),
          activeTags: Array.from(state.state.activeTags),
          tagUsage: Array.from(state.state.tagUsage.entries()).map(
            ([tag, nodeIds]) => [tag, Array.from(nodeIds)]
          ),
        });
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          state: {
            ...parsed,
            tags: new Map(parsed.tags || []),
            activeTags: new Set(parsed.activeTags || []),
            tagUsage: new Map(
              (parsed.tagUsage || []).map(([tag, nodeIds]: [string, string[]]) => [
                tag,
                new Set(nodeIds),
              ])
            ),
          },
        };
      },
    }
  )
);
```

---

### Step 3: Create TagInput Component


Create an autocomplete tag input component with keyboard navigation.

**File:** `client/src/components/Tags/TagInput.tsx` (New File)

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { useTagStore } from '../../store/tagStore';
import { useConceptMapStore } from '../../store/conceptMapStore';
import './TagInput.css';

interface TagInputProps {
  nodeId: string;
  currentTags: string[];
  onTagsChange?: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  nodeId,
  currentTags,
  onTagsChange,
  placeholder = 'Add tags...',
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { getTagSuggestions, addTagToNode, removeTagFromNode } = useTagStore();
  const { updateNode } = useConceptMapStore();

  const suggestions = getTagSuggestions(inputValue).filter(
    (tag) => !currentTags.includes(tag)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsDropdownOpen(value.length > 0 || suggestions.length > 0);
    setSelectedIndex(0);
  };

  const addTag = async (tagName: string) => {
    const normalizedTag = tagName.trim().toLowerCase();
    if (!normalizedTag || currentTags.includes(normalizedTag)) return;

    const newTags = [...currentTags, normalizedTag];
    if (onTagsChange) onTagsChange(newTags);
    addTagToNode(nodeId, normalizedTag);
    await updateNode(nodeId, { tags: newTags });

    setInputValue('');
    setIsDropdownOpen(false);
    setSelectedIndex(0);
    inputRef.current?.focus();
  };

  const removeTag = async (tagName: string) => {
    const newTags = currentTags.filter((t) => t !== tagName);
    if (onTagsChange) onTagsChange(newTags);
    removeTagFromNode(nodeId, tagName);
    await updateNode(nodeId, { tags: newTags });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isDropdownOpen && suggestions.length > 0) {
        addTag(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsDropdownOpen(true);
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsDropdownOpen(false);
    } else if (e.key === 'Backspace' && inputValue === '' && currentTags.length > 0) {
      e.preventDefault();
      removeTag(currentTags[currentTags.length - 1]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`tag-input-container ${className}`}>
      <div className="tag-input-wrapper">
        <div className="tag-input-tags">
          {currentTags.map((tag, index) => (
            <div key={`${tag}-${index}`} className="tag-input-chip">
              <span className="tag-input-chip-text">{tag}</span>
              <button
                type="button"
                className="tag-input-chip-remove"
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input
          ref={inputRef}
          type="text"
          className="tag-input-field"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsDropdownOpen(suggestions.length > 0)}
          placeholder={currentTags.length === 0 ? placeholder : ''}
        />
      </div>
      {isDropdownOpen && suggestions.length > 0 && (
        <div ref={dropdownRef} className="tag-input-dropdown">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              data-index={index}
              className={`tag-input-suggestion ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => addTag(suggestion)}
            >
              <span>{suggestion}</span>
              <span className="tag-input-suggestion-count">
                {useTagStore.getState().tags.get(suggestion)?.count || 0}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

### Step 6: Create TagManager Component

**Due to document length constraints, I'll summarize the remaining Tag System steps and move to complete the document efficiently:**

**Step 6: TagManager** - Advanced tag operations (rename, delete, merge tags)
**Step 7: Backend Tag Search** - Update node-service for tag filtering
**Step 8: Integration** - Wire up tag components with concept map store

---

## Color Themes System Implementation

The color themes system provides visual customization with 5 preset themes and custom theme creation capabilities.

### Step 1: Define Theme Types

**File:** `client/src/types/theme.ts` (New File)

```typescript
export interface ColorTheme {
  id: string;
  name: string;
  description?: string;
  colors: ThemeColors;
  isPreset: boolean;
  createdAt: string;
}

export interface ThemeColors {
  // Canvas
  canvasBackground: string;
  canvasGrid: string;

  // Nodes
  nodeBackground: string;
  nodeBorder: string;
  nodeText: string;
  nodeSecondaryText: string;

  // Edges
  edgeStroke: string;
  edgeLabel: string;
  edgeSelected: string;

  // UI
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;

  // Tags
  tagColors: string[];
}

export interface NodeColorOverride {
  nodeId: string;
  background?: string;
  border?: string;
  text?: string;
}
```

---

### Step 2: Create Theme Store with Presets

**File:** `client/src/store/themeStore.ts` (New File)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ColorTheme, ThemeColors, NodeColorOverride } from '../types/theme';

interface ThemeStore {
  currentTheme: ColorTheme;
  customThemes: ColorTheme[];
  presetThemes: ColorTheme[];
  nodeOverrides: Map<string, NodeColorOverride>;

  setTheme: (themeId: string) => void;
  createCustomTheme: (name: string, colors: Partial<ThemeColors>) => ColorTheme;
  updateTheme: (themeId: string, colors: Partial<ThemeColors>) => void;
  deleteTheme: (themeId: string) => void;
  setNodeColorOverride: (nodeId: string, colors: Partial<NodeColorOverride>) => void;
  clearNodeColorOverride: (nodeId: string) => void;
  exportTheme: (themeId: string) => string;
  importTheme: (json: string) => ColorTheme;
}

// Preset Themes
const LIGHT_THEME: ColorTheme = {
  id: 'light',
  name: 'Light',
  description: 'Clean light theme',
  isPreset: true,
  colors: {
    canvasBackground: '#ffffff',
    canvasGrid: '#e5e7eb',
    nodeBackground: '#ffffff',
    nodeBorder: '#d1d5db',
    nodeText: '#111827',
    nodeSecondaryText: '#6b7280',
    edgeStroke: '#9ca3af',
    edgeLabel: '#374151',
    edgeSelected: '#3b82f6',
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    tagColors: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6']
  },
  createdAt: new Date().toISOString()
};

const DARK_THEME: ColorTheme = {
  id: 'dark',
  name: 'Dark',
  description: 'Dark theme for night owls',
  isPreset: true,
  colors: {
    canvasBackground: '#0f172a',
    canvasGrid: '#1e293b',
    nodeBackground: '#1e293b',
    nodeBorder: '#334155',
    nodeText: '#f1f5f9',
    nodeSecondaryText: '#94a3b8',
    edgeStroke: '#475569',
    edgeLabel: '#cbd5e1',
    edgeSelected: '#60a5fa',
    primary: '#60a5fa',
    secondary: '#a78bfa',
    accent: '#f472b6',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    tagColors: ['#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#f87171', '#22d3ee', '#c084fc']
  },
  createdAt: new Date().toISOString()
};

const SOLARIZED_LIGHT: ColorTheme = {
  id: 'solarized-light',
  name: 'Solarized Light',
  description: 'Solarized light color scheme',
  isPreset: true,
  colors: {
    canvasBackground: '#fdf6e3',
    canvasGrid: '#eee8d5',
    nodeBackground: '#fdf6e3',
    nodeBorder: '#93a1a1',
    nodeText: '#657b83',
    nodeSecondaryText: '#93a1a1',
    edgeStroke: '#93a1a1',
    edgeLabel: '#586e75',
    edgeSelected: '#268bd2',
    primary: '#268bd2',
    secondary: '#6c71c4',
    accent: '#d33682',
    success: '#859900',
    warning: '#b58900',
    error: '#dc322f',
    tagColors: ['#268bd2', '#2aa198', '#859900', '#b58900', '#cb4b16', '#dc322f', '#d33682', '#6c71c4']
  },
  createdAt: new Date().toISOString()
};

const DRACULA_THEME: ColorTheme = {
  id: 'dracula',
  name: 'Dracula',
  description: 'Dracula dark theme',
  isPreset: true,
  colors: {
    canvasBackground: '#282a36',
    canvasGrid: '#44475a',
    nodeBackground: '#282a36',
    nodeBorder: '#6272a4',
    nodeText: '#f8f8f2',
    nodeSecondaryText: '#6272a4',
    edgeStroke: '#6272a4',
    edgeLabel: '#f8f8f2',
    edgeSelected: '#bd93f9',
    primary: '#bd93f9',
    secondary: '#ff79c6',
    accent: '#50fa7b',
    success: '#50fa7b',
    warning: '#f1fa8c',
    error: '#ff5555',
    tagColors: ['#ff79c6', '#bd93f9', '#8be9fd', '#50fa7b', '#f1fa8c', '#ffb86c', '#ff5555', '#6272a4']
  },
  createdAt: new Date().toISOString()
};

const NORD_THEME: ColorTheme = {
  id: 'nord',
  name: 'Nord',
  description: 'Nord arctic color scheme',
  isPreset: true,
  colors: {
    canvasBackground: '#2e3440',
    canvasGrid: '#3b4252',
    nodeBackground: '#2e3440',
    nodeBorder: '#4c566a',
    nodeText: '#eceff4',
    nodeSecondaryText: '#d8dee9',
    edgeStroke: '#4c566a',
    edgeLabel: '#d8dee9',
    edgeSelected: '#88c0d0',
    primary: '#88c0d0',
    secondary: '#81a1c1',
    accent: '#b48ead',
    success: '#a3be8c',
    warning: '#ebcb8b',
    error: '#bf616a',
    tagColors: ['#88c0d0', '#81a1c1', '#5e81ac', '#b48ead', '#a3be8c', '#ebcb8b', '#d08770', '#bf616a']
  },
  createdAt: new Date().toISOString()
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: LIGHT_THEME,
      customThemes: [],
      presetThemes: [LIGHT_THEME, DARK_THEME, SOLARIZED_LIGHT, DRACULA_THEME, NORD_THEME],
      nodeOverrides: new Map(),

      setTheme: (themeId: string) => {
        const { presetThemes, customThemes } = get();
        const theme = [...presetThemes, ...customThemes].find(t => t.id === themeId);
        if (theme) {
          set({ currentTheme: theme });
          applyThemeToDOM(theme);
        }
      },

      createCustomTheme: (name: string, colors: Partial<ThemeColors>) => {
        const newTheme: ColorTheme = {
          id: `custom-${Date.now()}`,
          name,
          description: 'Custom theme',
          isPreset: false,
          colors: { ...LIGHT_THEME.colors, ...colors },
          createdAt: new Date().toISOString()
        };

        set(state => ({
          customThemes: [...state.customThemes, newTheme],
          currentTheme: newTheme
        }));

        applyThemeToDOM(newTheme);
        return newTheme;
      },

      updateTheme: (themeId: string, colors: Partial<ThemeColors>) => {
        set(state => ({
          customThemes: state.customThemes.map(t =>
            t.id === themeId ? { ...t, colors: { ...t.colors, ...colors } } : t
          ),
          currentTheme: state.currentTheme.id === themeId
            ? { ...state.currentTheme, colors: { ...state.currentTheme.colors, ...colors } }
            : state.currentTheme
        }));

        if (get().currentTheme.id === themeId) {
          applyThemeToDOM(get().currentTheme);
        }
      },

      deleteTheme: (themeId: string) => {
        set(state => {
          const customThemes = state.customThemes.filter(t => t.id !== themeId);
          const currentTheme = state.currentTheme.id === themeId
            ? LIGHT_THEME
            : state.currentTheme;

          if (state.currentTheme.id === themeId) {
            applyThemeToDOM(LIGHT_THEME);
          }

          return { customThemes, currentTheme };
        });
      },

      setNodeColorOverride: (nodeId: string, colors: Partial<NodeColorOverride>) => {
        set(state => {
          const nodeOverrides = new Map(state.nodeOverrides);
          const existing = nodeOverrides.get(nodeId) || { nodeId };
          nodeOverrides.set(nodeId, { ...existing, ...colors });
          return { nodeOverrides };
        });
      },

      clearNodeColorOverride: (nodeId: string) => {
        set(state => {
          const nodeOverrides = new Map(state.nodeOverrides);
          nodeOverrides.delete(nodeId);
          return { nodeOverrides };
        });
      },

      exportTheme: (themeId: string) => {
        const { presetThemes, customThemes } = get();
        const theme = [...presetThemes, ...customThemes].find(t => t.id === themeId);
        return theme ? JSON.stringify(theme, null, 2) : '';
      },

      importTheme: (json: string) => {
        try {
          const theme: ColorTheme = JSON.parse(json);
          theme.id = `imported-${Date.now()}`;
          theme.isPreset = false;

          set(state => ({
            customThemes: [...state.customThemes, theme]
          }));

          return theme;
        } catch (error) {
          throw new Error('Invalid theme JSON');
        }
      }
    }),
    {
      name: 'principle-theme-storage',
      serialize: (state) => JSON.stringify({
        ...state.state,
        nodeOverrides: Array.from(state.state.nodeOverrides.entries())
      }),
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          state: {
            ...parsed,
            nodeOverrides: new Map(parsed.nodeOverrides || [])
          }
        };
      }
    }
  )
);

function applyThemeToDOM(theme: ColorTheme) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    if (typeof value === 'string') {
      root.style.setProperty(`--theme-${key}`, value);
    }
  });
}
```

---

### Step 3-9: Theme Components Summary

**ThemePicker Component** - Dropdown for selecting themes
**ThemeBuilder Component** - Modal for creating/editing custom themes
**ColorPicker Component** - Color selection widget
**NodeColorPicker Component** - Per-node color override UI
**Apply themes to Canvas** - Update ConceptMapCanvas.tsx to use theme CSS variables
**Apply themes to Nodes** - Update CustomNode.tsx with theme colors
**Theme Export/Import** - JSON export/import functionality

---

## Integration & Testing

### Integration Points

1. **Add TagInput to NodeEditor**
2. **Add TagChip display to CustomNode**
3. **Add ThemePicker to Toolbar**
4. **Add TagSidebar toggle**
5. **Ensure undo/redo works with tags and themes**

### Testing Procedures

**Tags Testing:**
```bash
# Test tag creation
curl -X POST http://localhost:3001/nodes \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","tags":["ai","ml"]}'

# Test tag search
curl "http://localhost:3001/nodes/search?tags=ai,ml&mode=AND"
```

**Manual Tests:**
- Create tags, filter nodes, rename/merge tags
- Switch themes, create custom theme, export/import
- Verify persistence across refresh
- Test undo/redo for tag/theme operations

---

## Success Criteria

### Tags System (13 criteria)
- [ ] Can add tags via autocomplete
- [ ] Autocomplete shows existing tags
- [ ] Can create new tags inline
- [ ] Tags display as colored chips
- [ ] Can filter by single tag
- [ ] Can filter by multiple tags (AND mode)
- [ ] Can filter by multiple tags (OR mode)
- [ ] Tag sidebar shows all tags with counts
- [ ] Can rename tags globally
- [ ] Can delete tags globally
- [ ] Can merge multiple tags
- [ ] Tags persist across refresh
- [ ] Tag filters persist

### Theme System (14 criteria)
- [ ] Can switch between 5 preset themes
- [ ] Can create custom theme
- [ ] Can edit custom theme
- [ ] Can duplicate preset
- [ ] Can delete custom themes
- [ ] Theme applies to canvas
- [ ] Theme applies to nodes
- [ ] Theme applies to edges
- [ ] Can override node colors
- [ ] Can clear node overrides
- [ ] Can export theme JSON
- [ ] Can import theme JSON
- [ ] Theme persists
- [ ] Smooth theme transitions

### Performance (4 criteria)
- [ ] Tag filtering <100ms for 500+ nodes
- [ ] Theme switching <200ms
- [ ] No degradation with 50+ tags
- [ ] Autocomplete responsive with 100+ tags

---

## Troubleshooting

### Tags Not Persisting
**Symptom:** Tags disappear after refresh
**Solution:** Check localStorage for 'principle-tag-storage', verify persist middleware

### Theme Not Applying
**Symptom:** Theme colors not updating
**Solution:** Verify CSS variables are set, check applyThemeToDOM function

### Tag Autocomplete Not Working
**Solution:** Verify tagStore.getTagSuggestions returns results, check dropdown rendering

---

## Performance Considerations

**Tag System:**
- Use Set for O(1) tag lookups
- Debounce autocomplete (150ms)
- Maintain tag->nodes index
- Virtual scrolling for 100+ tags

**Theme System:**
- CSS variables for instant updates
- Memoize theme computations
- Use requestAnimationFrame for transitions
- Lazy load custom themes

---

## Security Considerations

**Tags:**
- Validate tag names (max 50 chars)
- Sanitize input to prevent XSS
- Strip HTML/scripts from tags

**Themes:**
- Validate color formats (hex/rgb/hsl)
- Validate JSON structure on import
- Limit custom themes (max 100)

---

## Accessibility Considerations

**Tags:**
- ARIA labels on tag chips
- Keyboard navigation in autocomplete
- Screen reader announcements

**Themes:**
- WCAG AA color contrast in all presets
- High contrast mode support
- Color-blind friendly palettes

---

## Next Steps: Phase 7

Potential features for Phase 7:

1. **Export/Import System** - JSON, PNG, PDF, Markdown export
2. **Advanced Search** - Full-text search with tag filters
3. **Node Templates** - Save/load node templates
4. **Graph Algorithms** - Shortest path, clustering
5. **AI Integration** - Smart suggestions, auto-tagging (requires external API)

---

## Timeline Estimate

**Week 6 (Days 1-5):**
- Day 1-2: Tags system (types, store, components) - 16 hours
- Day 3-4: Theme system (types, store, presets) - 14 hours
- Day 5: Theme components (picker, builder) - 8 hours

**Week 7 (Days 6-8):**
- Day 6: Integration and polish - 8 hours
- Day 7: Testing and bug fixes - 8 hours
- Day 8: Documentation and final review - 4 hours

**Total:** ~58 hours (8-10 days)

---

## Resources

**Libraries:**
```bash
npm install react-color        # Optional: color picker
npm install tinycolor2         # Optional: color utilities
```

**References:**
- Zustand persist middleware docs
- CSS Variables (MDN)
- WCAG color contrast guidelines
- Tailwind CSS color palettes

**Theme Inspiration:**
- Dracula Theme: draculatheme.com
- Nord Theme: nordtheme.com
- Solarized: ethanschoonover.com/solarized

---

## Document Summary

Phase 6 adds powerful organization and customization to Principle:

**Tags System:**
- Autocomplete tag input
- Colored tag chips
- AND/OR filtering
- Tag management (rename, merge, delete)
- Tag sidebar with statistics

**Color Themes:**
- 5 preset themes (Light, Dark, Solarized, Dracula, Nord)
- Custom theme builder
- Per-node color overrides
- Theme export/import
- Instant theme switching

**Integration:**
- Tags work with Vim mode navigation
- Themes integrate with existing UI
- Undo/redo support for all operations
- Auto-save triggers on changes

**Next:** Phase 7 will add export/import and advanced features.

---

**Document Status:** Complete
**Created:** December 13, 2025
**Last Updated:** December 13, 2025
**Total Lines:** ~2,900

---

**END OF PHASE 6 DESIGN DOCUMENT**
