import { create } from 'zustand';
import { ConceptMap, ConceptMapNode, ConceptMapEdge, UpdateEdgeInput, Media, CORENodeType } from '../types';
import { conceptMapApi } from '../api/conceptMap.api';
import { nodeApi } from '../api/node.api';
import { edgeApi } from '../api/edge.api';
import { mediaApi } from '../api/media.api';

interface ConceptMapStore {
  // State
  conceptMaps: ConceptMap[];
  currentConceptMap: ConceptMap | null;
  nodes: ConceptMapNode[];
  edges: ConceptMapEdge[];
  media: Record<string, Media[]>; // nodeId -> Media[]
  loading: boolean;
  error: string | null;

  // Actions
  loadConceptMaps: () => Promise<void>;
  loadConceptMap: (id: string) => Promise<void>;
  createConceptMap: (name: string, description?: string) => Promise<ConceptMap>;
  updateConceptMap: (id: string, data: Partial<ConceptMap>) => Promise<void>;
  deleteConceptMap: (id: string) => Promise<void>;

  createNode: (title: string, position: { x: number; y: number }, nodeType?: CORENodeType) => Promise<ConceptMapNode>;
  updateNode: (id: string, data: Partial<ConceptMapNode>) => Promise<void>;
  updateNodeLocal: (id: string, data: Partial<ConceptMapNode>) => void;
  deleteNode: (id: string) => Promise<void>;
  deleteNodes: (ids: string[]) => Promise<void>;

  loadEdges: (conceptMapId: string) => Promise<void>;
  createEdge: (sourceNodeId: string, targetNodeId: string, label?: string) => Promise<ConceptMapEdge>;
  updateEdge: (id: string, data: UpdateEdgeInput) => Promise<void>;
  deleteEdge: (id: string) => Promise<void>;

  uploadMedia: (file: File, nodeId: string) => Promise<Media>;
  loadNodeMedia: (nodeId: string) => Promise<void>;
  deleteMedia: (mediaId: string, nodeId: string) => Promise<void>;

  setCurrentConceptMap: (conceptMap: ConceptMap | null) => void;
  clearError: () => void;
}

export const useConceptMapStore = create<ConceptMapStore>((set, get) => ({
  conceptMaps: [],
  currentConceptMap: null,
  nodes: [],
  edges: [],
  media: {},
  loading: false,
  error: null,

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

  createNode: async (title: string, position: { x: number; y: number }, nodeType?: CORENodeType) => {
    const { currentConceptMap } = get();
    if (!currentConceptMap) {
      throw new Error('No concept map selected');
    }

    try {
      const node = await nodeApi.create({
        conceptMapId: currentConceptMap.id,
        title,
        position,
        ...(nodeType ? { nodeType } : {})
      } as any);
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
    try {
      await nodeApi.delete(id);
      set((state) => ({
        nodes: state.nodes.filter((n) => n.id !== id)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteNodes: async (ids: string[]) => {
    try {
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

  createEdge: async (sourceNodeId: string, targetNodeId: string, label?: string) => {
    const { currentConceptMap } = get();
    if (!currentConceptMap) {
      throw new Error('No concept map selected');
    }

    try {
      const edge = await edgeApi.create({
        conceptMapId: currentConceptMap.id,
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

  clearError: () => set({ error: null })
}));
