import { create } from 'zustand';
import { ConceptMap, ConceptMapNode, ConceptMapEdge, UpdateEdgeInput, Media } from '../types';
import { conceptMapApi } from '../api/conceptMap.api';
import { nodeApi } from '../api/node.api';
import { edgeApi } from '../api/edge.api';
import { mediaApi } from '../api/media.api';

// History snapshot for undo/redo
interface HistorySnapshot {
  nodes: ConceptMapNode[];
  edges: ConceptMapEdge[];
  timestamp: number;
}

interface ConceptMapStore {
  // State
  conceptMaps: ConceptMap[];
  currentConceptMap: ConceptMap | null;
  nodes: ConceptMapNode[];
  edges: ConceptMapEdge[];
  media: Record<string, Media[]>; // nodeId -> Media[]
  loading: boolean;
  error: string | null;

  // Undo/Redo history
  history: HistorySnapshot[];
  historyIndex: number;
  maxHistorySize: number;

  // Actions
  loadConceptMaps: () => Promise<void>;
  loadConceptMap: (id: string) => Promise<void>;
  createConceptMap: (name: string, description?: string) => Promise<ConceptMap>;
  updateConceptMap: (id: string, data: Partial<ConceptMap>) => Promise<void>;
  deleteConceptMap: (id: string) => Promise<void>;

  createNode: (title: string, position: { x: number; y: number }) => Promise<ConceptMapNode>;
  updateNode: (id: string, data: Partial<ConceptMapNode>) => Promise<void>;
  updateNodeLocal: (id: string, data: Partial<ConceptMapNode>) => void;
  deleteNode: (id: string) => Promise<void>;
  deleteNodes: (ids: string[], skipHistory?: boolean) => Promise<void>;

  loadEdges: (conceptMapId: string) => Promise<void>;
  createEdge: (sourceNodeId: string, targetNodeId: string, sourceHandleId?: string, targetHandleId?: string, label?: string) => Promise<ConceptMapEdge>;
  updateEdge: (id: string, data: UpdateEdgeInput) => Promise<void>;
  deleteEdge: (id: string) => Promise<void>;
  deleteEdgeWithoutHistory: (id: string) => Promise<void>;

  uploadMedia: (file: File, nodeId: string) => Promise<Media>;
  loadNodeMedia: (nodeId: string) => Promise<void>;
  deleteMedia: (mediaId: string, nodeId: string) => Promise<void>;

  setCurrentConceptMap: (conceptMap: ConceptMap | null) => void;
  clearError: () => void;

  // Undo/Redo actions
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Portal methods
  createPortalNode: (targetMapId: string, targetNodeId: string, position: { x: number; y: number }) => Promise<ConceptMapNode>;
  navigateThroughPortal: (portalNode: ConceptMapNode, onMapSwitch: (mapId: string, targetNodeId?: string) => void) => Promise<void>;

  // Layout actions
  autoLayout: (options?: { algorithm?: 'layered' | 'force' | 'mrtree'; direction?: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT'; nodeSpacing?: number; layerSpacing?: number }) => Promise<void>;
}

export const useConceptMapStore = create<ConceptMapStore>((set, get) => ({
  conceptMaps: [],
  currentConceptMap: null,
  nodes: [],
  edges: [],
  media: {},
  loading: false,
  error: null,
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,

  loadConceptMaps: async () => {
    set({ loading: true, error: null });
    try {
      const conceptMaps = await conceptMapApi.getAll();
      set({ conceptMaps, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  loadConceptMap: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const conceptMap = await conceptMapApi.getById(id);
      set({
        currentConceptMap: conceptMap,
        nodes: conceptMap.nodes || [],
        loading: false
      });

      // Load edges before saving initial history snapshot
      const { loadEdges, saveHistory } = get();
      await loadEdges(id);

      // Save initial state to history after both nodes AND edges are loaded
      saveHistory();
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createConceptMap: async (name: string, description?: string) => {
    set({ loading: true, error: null });
    try {
      const conceptMap = await conceptMapApi.create({ name, description });
      set((state) => ({
        conceptMaps: [...state.conceptMaps, conceptMap],
        currentConceptMap: conceptMap,
        loading: false
      }));
      return conceptMap;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateConceptMap: async (id: string, data: Partial<ConceptMap>) => {
    try {
      const updated = await conceptMapApi.update(id, data);
      set((state) => ({
        currentConceptMap: state.currentConceptMap?.id === id ? updated : state.currentConceptMap,
        conceptMaps: state.conceptMaps.map((m) => (m.id === id ? updated : m))
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteConceptMap: async (id: string) => {
    try {
      await conceptMapApi.delete(id);
      set((state) => ({
        conceptMaps: state.conceptMaps.filter((m) => m.id !== id),
        currentConceptMap: state.currentConceptMap?.id === id ? null : state.currentConceptMap,
        nodes: state.currentConceptMap?.id === id ? [] : state.nodes
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  createNode: async (title: string, position: { x: number; y: number }) => {
    const { currentConceptMap, saveHistory } = get();
    if (!currentConceptMap) {
      throw new Error('No concept map selected');
    }

    try {
      // Save history before making changes
      saveHistory();

      const node = await nodeApi.create({
        conceptMapId: currentConceptMap.id,
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

  updateNode: async (id: string, data: Partial<ConceptMapNode>) => {
    try {
      const updated = await nodeApi.update(id, data);
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id
            ? { ...n, ...updated }
            : n
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateNodeLocal: (id: string, data: Partial<ConceptMapNode>) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id
          ? { ...n, ...data }
          : n
      )
    }));
  },

  deleteNode: async (id: string) => {
    const { saveHistory } = get();
    try {
      // Save history before deleting
      saveHistory();

      await nodeApi.delete(id);
      set((state) => ({
        nodes: state.nodes.filter((n) => n.id !== id)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteNodes: async (ids: string[], skipHistory: boolean = false) => {
    const { saveHistory } = get();
    try {
      // Save history before deleting (unless caller already did)
      if (!skipHistory) {
        saveHistory();
      }

      // Delete all nodes in parallel
      await Promise.all(ids.map(id => nodeApi.delete(id)));
      set((state) => ({
        nodes: state.nodes.filter((n) => !ids.includes(n.id))
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  loadEdges: async (conceptMapId: string) => {
    try {
      const edges = await edgeApi.getByConceptMap(conceptMapId);
      set({ edges });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  createEdge: async (
    sourceNodeId: string,
    targetNodeId: string,
    sourceHandleId?: string,
    targetHandleId?: string,
    label?: string
  ) => {
    console.log('[STORE] createEdge called with:', {
      sourceNodeId,
      targetNodeId,
      sourceHandleId,
      targetHandleId,
      label
    });

    const { currentConceptMap, saveHistory } = get();
    if (!currentConceptMap) {
      throw new Error('No concept map selected');
    }

    try {
      // Save history before creating edge
      saveHistory();

      const edgeData = {
        conceptMapId: currentConceptMap.id,
        sourceNodeId,
        targetNodeId,
        sourceHandleId,
        targetHandleId,
        label,
        style: {}
      };

      console.log('[STORE] Calling edgeApi.create with:', edgeData);

      const edge = await edgeApi.create(edgeData);

      console.log('[STORE] Edge created, received from API:', edge);

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
    const { saveHistory } = get();
    try {
      // Save history before deleting edge
      saveHistory();

      await edgeApi.delete(id);
      set((state) => ({
        edges: state.edges.filter((e) => e.id !== id)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Delete edge without saving history (for cascade deletes)
  deleteEdgeWithoutHistory: async (id: string) => {
    try {
      await edgeApi.delete(id);
      set((state) => ({
        edges: state.edges.filter((e) => e.id !== id)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  uploadMedia: async (file: File, nodeId: string) => {
    try {
      const media = await mediaApi.upload(file, nodeId);

      // Update node's imageIds
      const node = get().nodes.find((n) => n.id === nodeId);
      if (node) {
        const updatedImageIds = [...node.imageIds, media.id];
        await nodeApi.update(nodeId, { imageIds: updatedImageIds });

        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, imageIds: updatedImageIds } : n
          ),
          media: {
            ...state.media,
            [nodeId]: [...(state.media[nodeId] || []), media]
          }
        }));
      }

      return media;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  loadNodeMedia: async (nodeId: string) => {
    try {
      const nodeMedia = await mediaApi.getByNode(nodeId);
      set((state) => ({
        media: {
          ...state.media,
          [nodeId]: nodeMedia
        }
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteMedia: async (mediaId: string, nodeId: string) => {
    try {
      await mediaApi.delete(mediaId);

      // Update node's imageIds
      const node = get().nodes.find((n) => n.id === nodeId);
      if (node) {
        const updatedImageIds = node.imageIds.filter((id) => id !== mediaId);
        await nodeApi.update(nodeId, { imageIds: updatedImageIds });

        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, imageIds: updatedImageIds } : n
          ),
          media: {
            ...state.media,
            [nodeId]: (state.media[nodeId] || []).filter((m) => m.id !== mediaId)
          }
        }));
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setCurrentConceptMap: (conceptMap: ConceptMap | null) => {
    set({ currentConceptMap: conceptMap, nodes: conceptMap?.nodes || [] });
  },

  clearError: () => set({ error: null }),

  // Portal methods
  createPortalNode: async (
    targetMapId: string,
    targetNodeId: string,
    position: { x: number; y: number }
  ) => {
    const { currentConceptMap, conceptMaps, saveHistory } = get();
    if (!currentConceptMap) {
      throw new Error('No concept map selected');
    }

    try {
      // Get target map and node info
      const targetMap = conceptMaps.find(m => m.id === targetMapId);
      const targetNode = await nodeApi.getById(targetNodeId);

      if (!targetMap || !targetNode) {
        throw new Error('Target map or node not found');
      }

      // Save history before creating portal
      saveHistory();

      // Create portal node
      const portalNode = await nodeApi.create({
        conceptMapId: currentConceptMap.id,
        title: `→ ${targetMap.name}: ${targetNode.title}`,
        position,
        nodeType: 'portal',
        shape: 'portal',
        portalTargetMapId: targetMapId,
        portalTargetNodeId: targetNodeId,
        content: {}
      });

      set((state) => ({
        nodes: [...state.nodes, portalNode]
      }));

      return portalNode;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  navigateThroughPortal: async (
    portalNode: ConceptMapNode,
    onMapSwitch: (mapId: string, targetNodeId?: string) => void
  ) => {
    if (portalNode.nodeType !== 'portal' || !portalNode.portalTargetMapId) {
      console.error('[PORTAL] Not a valid portal node');
      return;
    }

    const { conceptMaps } = get();
    const { portalTargetMapId, portalTargetNodeId, conceptMapId, id } = portalNode;

    try {
      // Check if return portal already exists in target map
      const targetMapNodes = await nodeApi.getByConceptMapId(portalTargetMapId);
      const existingReturnPortal = targetMapNodes.find(n =>
        n.nodeType === 'portal' &&
        n.portalTargetMapId === conceptMapId &&
        n.portalTargetNodeId === id
      );

      // If no return portal exists, create one
      if (!existingReturnPortal && portalTargetNodeId) {
        const targetNode = await nodeApi.getById(portalTargetNodeId);
        const sourceMap = conceptMaps.find(m => m.id === conceptMapId);

        if (targetNode && sourceMap) {
          await nodeApi.create({
            conceptMapId: portalTargetMapId,
            title: `← ${sourceMap.name}: ${portalNode.title.replace('→ ', '')}`,
            position: {
              x: targetNode.position.x + 200,
              y: targetNode.position.y
            },
            nodeType: 'portal',
            shape: 'portal',
            portalTargetMapId: conceptMapId,
            portalTargetNodeId: id,
            portalSourceMapId: conceptMapId,
            portalSourceNodeId: id,
            content: {}
          });
        }
      }

      // Trigger map switch via callback
      onMapSwitch(portalTargetMapId, portalTargetNodeId);
    } catch (error: any) {
      console.error('[PORTAL] Failed to navigate:', error);
      set({ error: error.message });
    }
  },

  // Undo/Redo implementation
  saveHistory: () => {
    const state = get();
    const snapshot: HistorySnapshot = {
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
      timestamp: Date.now()
    };

    // Remove any history after current index (when making changes after undo)
    const newHistory = state.history.slice(0, state.historyIndex + 1);

    // Add new snapshot
    newHistory.push(snapshot);

    // Limit history size
    if (newHistory.length > state.maxHistorySize) {
      newHistory.shift();
      set({ history: newHistory, historyIndex: newHistory.length - 1 });
    } else {
      set({ history: newHistory, historyIndex: newHistory.length - 1 });
    }
  },

  undo: async () => {
    const state = get();

    if (state.historyIndex <= 0) {
      console.log('[UNDO] No more history to undo');
      return;
    }

    // Target the snapshot BEFORE the current one (the one before saveHistory was called)
    const targetSnapshot = state.history[state.historyIndex - 1];
    const currentConceptMap = state.currentConceptMap;

    if (!currentConceptMap) {
      console.error('[UNDO] No concept map loaded');
      return;
    }

    console.log('[UNDO] Restoring snapshot from', new Date(targetSnapshot.timestamp));

    // CRITICAL: Capture current state BEFORE modifying it
    const currentNodes = state.nodes;
    const currentEdges = state.edges;

    // Update state first for immediate UI feedback
    set({
      nodes: JSON.parse(JSON.stringify(targetSnapshot.nodes)),
      edges: JSON.parse(JSON.stringify(targetSnapshot.edges)),
      historyIndex: state.historyIndex - 1
    });

    // Sync with backend - use captured state (BEFORE modification)
    // 1. Find nodes to delete (in current state but not in snapshot)
    const currentNodeIds = new Set(currentNodes.map(n => n.id));
    const snapshotNodeIds = new Set(targetSnapshot.nodes.map(n => n.id));
    const nodesToDelete = currentNodes.filter(n => !snapshotNodeIds.has(n.id));

    // 2. Find nodes to create (in snapshot but not in current state)
    const nodesToCreate = targetSnapshot.nodes.filter(n => !currentNodeIds.has(n.id));

    // 3. Find nodes to update (in both, but might have changed)
    const nodesToUpdate = targetSnapshot.nodes.filter(n => currentNodeIds.has(n.id));

    // 4. Find edges to delete (in current state but not in snapshot)
    const currentEdgeIds = new Set(currentEdges.map(e => e.id));
    const snapshotEdgeIds = new Set(targetSnapshot.edges.map(e => e.id));
    const edgesToDelete = currentEdges.filter(e => !snapshotEdgeIds.has(e.id));

    // 5. Find edges to create (in snapshot but not in current state)
    const edgesToCreate = targetSnapshot.edges.filter(e => !currentEdgeIds.has(e.id));

    console.log('[UNDO] Sync plan:', {
      nodesToDelete: nodesToDelete.length,
      nodesToCreate: nodesToCreate.length,
      nodesToUpdate: nodesToUpdate.length,
      edgesToDelete: edgesToDelete.length,
      edgesToCreate: edgesToCreate.length
    });

    // Execute sync in correct order (SEQUENTIAL, not parallel)
    // Order matters: edges depend on nodes, so we must create nodes before edges
    (async () => {
      try {
        // Step 1: Delete edges first (they reference nodes)
        await Promise.all(
          edgesToDelete.map(edge => edgeApi.delete(edge.id).catch(console.error))
        );

        // Step 2: Delete nodes (now safe, edges are gone)
        await Promise.all(
          nodesToDelete.map(node => nodeApi.delete(node.id).catch(console.error))
        );

        // Step 3: Create nodes FIRST (edges will reference them)
        // Preserve IDs and try undelete if create fails (soft-deleted nodes)
        await Promise.all(
          nodesToCreate.map(async (node) => {
            try {
              await nodeApi.create({
                id: node.id, // Preserve ID for edge references
                conceptMapId: currentConceptMap.id,
                title: node.title,
                position: node.position,
                content: node.content,
                style: node.style,
                imageIds: node.imageIds,
                tags: node.tags
              });
            } catch (error: any) {
              // If create fails (node exists but is soft-deleted), undelete it
              await nodeApi.undelete(node.id).catch(console.error);
            }
          })
        );

        // Step 4: Update existing nodes
        await Promise.all(
          nodesToUpdate.map(node =>
            nodeApi.update(node.id, {
              title: node.title,
              position: node.position,
              content: node.content,
              style: node.style,
              imageIds: node.imageIds,
              tags: node.tags
            }).catch(console.error)
          )
        );

        // Step 5: Create edges LAST (nodes exist now)
        // Preserve edge IDs to maintain references
        await Promise.all(
          edgesToCreate.map(edge =>
            edgeApi.create({
              id: edge.id, // Preserve ID
              conceptMapId: currentConceptMap.id,
              sourceNodeId: edge.sourceNodeId,
              targetNodeId: edge.targetNodeId,
              label: edge.label,
              style: edge.style
            }).catch(console.error)
          )
        );

        console.log('[UNDO] Sync completed successfully');
      } catch (error) {
        console.error('[UNDO] Sync error:', error);
      }
    })();
  },

  redo: async () => {
    const state = get();

    if (state.historyIndex >= state.history.length - 1) {
      console.log('[REDO] No more history to redo');
      return;
    }

    const nextSnapshot = state.history[state.historyIndex + 1];
    const currentConceptMap = state.currentConceptMap;

    if (!currentConceptMap) {
      console.error('[REDO] No concept map loaded');
      return;
    }

    console.log('[REDO] Restoring snapshot from', new Date(nextSnapshot.timestamp));

    // CRITICAL: Capture current state BEFORE modifying it
    const currentNodes = state.nodes;
    const currentEdges = state.edges;

    // Update state first for immediate UI feedback
    set({
      nodes: JSON.parse(JSON.stringify(nextSnapshot.nodes)),
      edges: JSON.parse(JSON.stringify(nextSnapshot.edges)),
      historyIndex: state.historyIndex + 1
    });

    // Sync with backend - use captured state (BEFORE modification)
    // 1. Find nodes to delete (in current state but not in snapshot)
    const currentNodeIds = new Set(currentNodes.map(n => n.id));
    const snapshotNodeIds = new Set(nextSnapshot.nodes.map(n => n.id));
    const nodesToDelete = currentNodes.filter(n => !snapshotNodeIds.has(n.id));

    // 2. Find nodes to create (in snapshot but not in current state)
    const nodesToCreate = nextSnapshot.nodes.filter(n => !currentNodeIds.has(n.id));

    // 3. Find nodes to update (in both, but might have changed)
    const nodesToUpdate = nextSnapshot.nodes.filter(n => currentNodeIds.has(n.id));

    // 4. Find edges to delete (in current state but not in snapshot)
    const currentEdgeIds = new Set(currentEdges.map(e => e.id));
    const snapshotEdgeIds = new Set(nextSnapshot.edges.map(e => e.id));
    const edgesToDelete = currentEdges.filter(e => !snapshotEdgeIds.has(e.id));

    // 5. Find edges to create (in snapshot but not in current state)
    const edgesToCreate = nextSnapshot.edges.filter(e => !currentEdgeIds.has(e.id));

    console.log('[REDO] Sync plan:', {
      nodesToDelete: nodesToDelete.length,
      nodesToCreate: nodesToCreate.length,
      nodesToUpdate: nodesToUpdate.length,
      edgesToDelete: edgesToDelete.length,
      edgesToCreate: edgesToCreate.length
    });

    // Execute sync in correct order (SEQUENTIAL, not parallel)
    // Order matters: edges depend on nodes, so we must create nodes before edges
    (async () => {
      try {
        // Step 1: Delete edges first (they reference nodes)
        await Promise.all(
          edgesToDelete.map(edge => edgeApi.delete(edge.id).catch(console.error))
        );

        // Step 2: Delete nodes (now safe, edges are gone)
        await Promise.all(
          nodesToDelete.map(node => nodeApi.delete(node.id).catch(console.error))
        );

        // Step 3: Create nodes FIRST (edges will reference them)
        // Preserve IDs and try undelete if create fails (soft-deleted nodes)
        await Promise.all(
          nodesToCreate.map(async (node) => {
            try {
              await nodeApi.create({
                id: node.id, // Preserve ID for edge references
                conceptMapId: currentConceptMap.id,
                title: node.title,
                position: node.position,
                content: node.content,
                style: node.style,
                imageIds: node.imageIds,
                tags: node.tags
              });
            } catch (error: any) {
              // If create fails (node exists but is soft-deleted), undelete it
              await nodeApi.undelete(node.id).catch(console.error);
            }
          })
        );

        // Step 4: Update existing nodes
        await Promise.all(
          nodesToUpdate.map(node =>
            nodeApi.update(node.id, {
              title: node.title,
              position: node.position,
              content: node.content,
              style: node.style,
              imageIds: node.imageIds,
              tags: node.tags
            }).catch(console.error)
          )
        );

        // Step 5: Create edges LAST (nodes exist now)
        // Preserve edge IDs to maintain references
        await Promise.all(
          edgesToCreate.map(edge =>
            edgeApi.create({
              id: edge.id, // Preserve ID
              conceptMapId: currentConceptMap.id,
              sourceNodeId: edge.sourceNodeId,
              targetNodeId: edge.targetNodeId,
              label: edge.label,
              style: edge.style
            }).catch(console.error)
          )
        );

        console.log('[REDO] Sync completed successfully');
      } catch (error) {
        console.error('[REDO] Sync error:', error);
      }
    })();
  },

  canUndo: () => {
    const state = get();
    return state.historyIndex > 0;
  },

  canRedo: () => {
    const state = get();
    return state.historyIndex < state.history.length - 1;
  },

  // Auto-layout using ELKjs
  autoLayout: async (options = {}) => {
    const { currentConceptMap, saveHistory } = get();
    if (!currentConceptMap) {
      console.error('[LAYOUT] No concept map selected');
      return;
    }

    try {
      // Save history before applying layout
      saveHistory();

      console.log('[LAYOUT] Applying auto-layout to map:', currentConceptMap.id, options);

      const result = await conceptMapApi.applyLayout(currentConceptMap.id, options);

      if (result.nodes) {
        // Update local nodes with new positions
        set((state) => ({
          nodes: state.nodes.map((node) => {
            const updatedNode = result.nodes.find((n: ConceptMapNode) => n.id === node.id);
            if (updatedNode) {
              return { ...node, position: updatedNode.position };
            }
            return node;
          })
        }));
        console.log('[LAYOUT] Updated', result.nodes.length, 'node positions');
      }
    } catch (error: any) {
      console.error('[LAYOUT] Failed to apply layout:', error);
      set({ error: error.message || 'Failed to apply layout' });
    }
  }
}));
