import { create } from 'zustand';
import { Walk, WalkStep, CreateWalkInput, UpdateStepInput } from '../types/walk';
import { walkApi } from '../api/walk.api';

interface WalkStore {
  // State
  walks: Walk[];
  currentWalk: Walk | null;
  isEditing: boolean;           // True when adding nodes to walk
  isPresenting: boolean;        // True during presentation mode
  currentStepIndex: number;     // Current step during presentation
  panelOpen: boolean;           // True when walk panel is visible
  loading: boolean;
  error: string | null;

  // Walk CRUD
  loadWalks: (conceptMapId: string) => Promise<void>;
  createWalk: (input: CreateWalkInput) => Promise<Walk>;
  updateWalk: (id: string, name?: string, description?: string) => Promise<void>;
  deleteWalk: (id: string) => Promise<void>;
  selectWalk: (walk: Walk | null) => void;
  refreshCurrentWalk: () => Promise<void>;

  // Step management
  addStep: (nodeId: string) => Promise<void>;
  removeStep: (stepId: string) => Promise<void>;
  updateStep: (stepId: string, input: UpdateStepInput) => Promise<void>;
  reorderSteps: (stepIds: string[]) => Promise<void>;

  // Editing mode
  startEditing: () => void;
  stopEditing: () => void;
  toggleEditing: () => void;

  // Presentation mode
  startPresentation: (walk?: Walk) => void;
  stopPresentation: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;

  // Panel visibility
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;

  // Utilities
  clearError: () => void;
  getStepByNodeId: (nodeId: string) => WalkStep | undefined;
  isNodeInWalk: (nodeId: string) => boolean;
  getNodeStepNumber: (nodeId: string) => number | null;
  removeStepByNodeId: (nodeId: string) => Promise<void>;
}

export const useWalkStore = create<WalkStore>((set, get) => ({
  // Initial state
  walks: [],
  currentWalk: null,
  isEditing: false,
  isPresenting: false,
  currentStepIndex: 0,
  panelOpen: false,
  loading: false,
  error: null,

  // Load walks for a concept map
  loadWalks: async (conceptMapId: string) => {
    set({ loading: true, error: null });
    try {
      const walks = await walkApi.getByConceptMap(conceptMapId);
      set({ walks, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Create a new walk
  createWalk: async (input: CreateWalkInput) => {
    set({ loading: true, error: null });
    try {
      const walk = await walkApi.create(input);
      set((state) => ({
        walks: [...state.walks, walk],
        currentWalk: walk,
        isEditing: true, // Automatically enter edit mode
        loading: false
      }));
      return walk;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update walk metadata
  updateWalk: async (id: string, name?: string, description?: string) => {
    try {
      const updated = await walkApi.update(id, { name, description });
      set((state) => ({
        walks: state.walks.map((w) => (w.id === id ? updated : w)),
        currentWalk: state.currentWalk?.id === id ? updated : state.currentWalk
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Delete a walk
  deleteWalk: async (id: string) => {
    try {
      await walkApi.delete(id);
      set((state) => ({
        walks: state.walks.filter((w) => w.id !== id),
        currentWalk: state.currentWalk?.id === id ? null : state.currentWalk,
        isEditing: state.currentWalk?.id === id ? false : state.isEditing
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Select a walk
  selectWalk: (walk: Walk | null) => {
    set({
      currentWalk: walk,
      isEditing: false,
      isPresenting: false,
      currentStepIndex: 0
    });
  },

  // Refresh current walk from server
  refreshCurrentWalk: async () => {
    const { currentWalk } = get();
    if (!currentWalk) return;

    try {
      const updated = await walkApi.getById(currentWalk.id);
      set((state) => ({
        currentWalk: updated,
        walks: state.walks.map((w) => (w.id === updated.id ? updated : w))
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Add a step to the current walk
  addStep: async (nodeId: string) => {
    const { currentWalk, isEditing } = get();
    if (!currentWalk || !isEditing) return;

    // Check if node is already in walk
    if (currentWalk.steps.some((s) => s.nodeId === nodeId)) {
      console.log('[Walk] Node already in walk');
      return;
    }

    try {
      const order = currentWalk.steps.length;
      const step = await walkApi.addStep(currentWalk.id, {
        nodeId,
        order,
        zoomLevel: 1.5
      });

      set((state) => {
        const updatedWalk = {
          ...state.currentWalk!,
          steps: [...state.currentWalk!.steps, step]
        };
        return {
          currentWalk: updatedWalk,
          walks: state.walks.map((w) => (w.id === updatedWalk.id ? updatedWalk : w))
        };
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Remove a step from the current walk
  removeStep: async (stepId: string) => {
    const { currentWalk } = get();
    if (!currentWalk) return;

    try {
      await walkApi.removeStep(currentWalk.id, stepId);

      set((state) => {
        const updatedSteps = state.currentWalk!.steps
          .filter((s) => s.id !== stepId)
          .map((s, index) => ({ ...s, order: index })); // Renumber

        const updatedWalk = {
          ...state.currentWalk!,
          steps: updatedSteps
        };

        return {
          currentWalk: updatedWalk,
          walks: state.walks.map((w) => (w.id === updatedWalk.id ? updatedWalk : w))
        };
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Update a step
  updateStep: async (stepId: string, input: UpdateStepInput) => {
    const { currentWalk } = get();
    if (!currentWalk) return;

    try {
      const updated = await walkApi.updateStep(currentWalk.id, stepId, input);

      set((state) => {
        const updatedSteps = state.currentWalk!.steps.map((s) =>
          s.id === stepId ? { ...s, ...updated } : s
        );

        const updatedWalk = {
          ...state.currentWalk!,
          steps: updatedSteps
        };

        return {
          currentWalk: updatedWalk,
          walks: state.walks.map((w) => (w.id === updatedWalk.id ? updatedWalk : w))
        };
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Reorder steps
  reorderSteps: async (stepIds: string[]) => {
    const { currentWalk } = get();
    if (!currentWalk) return;

    try {
      const updatedSteps = await walkApi.reorderSteps(currentWalk.id, stepIds);

      set((state) => {
        const updatedWalk = {
          ...state.currentWalk!,
          steps: updatedSteps
        };

        return {
          currentWalk: updatedWalk,
          walks: state.walks.map((w) => (w.id === updatedWalk.id ? updatedWalk : w))
        };
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Start editing mode
  startEditing: () => {
    const { currentWalk } = get();
    if (currentWalk) {
      set({ isEditing: true, isPresenting: false });
    }
  },

  // Stop editing mode
  stopEditing: () => {
    set({ isEditing: false });
  },

  // Toggle editing mode
  toggleEditing: () => {
    const { isEditing, currentWalk } = get();
    if (currentWalk) {
      set({ isEditing: !isEditing, isPresenting: false });
    }
  },

  // Start presentation mode
  startPresentation: (walk?: Walk) => {
    const targetWalk = walk || get().currentWalk;
    if (!targetWalk || targetWalk.steps.length === 0) {
      console.log('[Walk] Cannot start presentation: no walk or steps');
      return;
    }

    set({
      currentWalk: targetWalk,
      isPresenting: true,
      isEditing: false,
      currentStepIndex: 0
    });
  },

  // Stop presentation mode
  stopPresentation: () => {
    set({ isPresenting: false, currentStepIndex: 0 });
  },

  // Navigate to next step
  nextStep: () => {
    const { currentWalk, currentStepIndex } = get();
    if (!currentWalk) return;

    const maxIndex = currentWalk.steps.length - 1;
    if (currentStepIndex < maxIndex) {
      set({ currentStepIndex: currentStepIndex + 1 });
    }
  },

  // Navigate to previous step
  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  // Go to specific step
  goToStep: (index: number) => {
    const { currentWalk } = get();
    if (!currentWalk) return;

    const maxIndex = currentWalk.steps.length - 1;
    if (index >= 0 && index <= maxIndex) {
      set({ currentStepIndex: index });
    }
  },

  // Panel visibility
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),

  // Clear error
  clearError: () => set({ error: null }),

  // Get step by node ID
  getStepByNodeId: (nodeId: string) => {
    const { currentWalk } = get();
    return currentWalk?.steps.find((s) => s.nodeId === nodeId);
  },

  // Check if node is in current walk
  isNodeInWalk: (nodeId: string) => {
    const { currentWalk } = get();
    return currentWalk?.steps.some((s) => s.nodeId === nodeId) || false;
  },

  // Get step number for a node (1-indexed for display)
  getNodeStepNumber: (nodeId: string) => {
    const { currentWalk } = get();
    if (!currentWalk) return null;

    const step = currentWalk.steps.find((s) => s.nodeId === nodeId);
    return step ? step.order + 1 : null;
  },

  // Remove step by node ID
  removeStepByNodeId: async (nodeId: string) => {
    const { currentWalk, removeStep, getStepByNodeId } = get();
    if (!currentWalk) return;

    const step = getStepByNodeId(nodeId);
    if (step) {
      await removeStep(step.id);
    }
  }
}));
