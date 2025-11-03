import { create } from 'zustand';
import { Mindmap, MindmapNode, MindmapEdge, UpdateEdgeInput } from '../types';
import { mindmapApi } from '../api/mindmap.api';
import { nodeApi } from '../api/node.api';
import { edgeApi } from '../api/edge.api';

interface MindmapStore {
  // State
  mindmaps: Mindmap[];
  currentMindmap: Mindmap | null;
  nodes: MindmapNode[];
  edges: MindmapEdge[];
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
  updateNodeLocal: (id: string, data: Partial<MindmapNode>) => void;
  deleteNode: (id: string) => Promise<void>;
  deleteNodes: (ids: string[]) => Promise<void>;

  loadEdges: (mindmapId: string) => Promise<void>;
  createEdge: (sourceNodeId: string, targetNodeId: string, label?: string) => Promise<MindmapEdge>;
  updateEdge: (id: string, data: UpdateEdgeInput) => Promise<void>;
  deleteEdge: (id: string) => Promise<void>;

  setCurrentMindmap: (mindmap: Mindmap | null) => void;
  clearError: () => void;
}

export const useMindmapStore = create<MindmapStore>((set, get) => ({
  mindmaps: [],
  currentMindmap: null,
  nodes: [],
  edges: [],
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

  updateNodeLocal: (id: string, data: Partial<MindmapNode>) => {
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

  setCurrentMindmap: (mindmap: Mindmap | null) => {
    set({ currentMindmap: mindmap, nodes: mindmap?.nodes || [] });
  },

  clearError: () => set({ error: null })
}));
