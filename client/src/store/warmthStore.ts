import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WarmthState {
  // Feature toggle
  enabled: boolean;

  // Lamport clock
  globalCounter: number;
  nodeInteractions: Record<string, number>; // nodeId -> lastInteraction counter

  // Settings
  maxHistory: number; // How many interactions before fully cold
}

interface WarmthActions {
  toggleEnabled: () => void;
  recordInteraction: (nodeId: string) => void;
  getWarmth: (nodeId: string) => number; // Returns 0.0 to 1.0
  resetWarmth: () => void;
}

type WarmthStore = WarmthState & WarmthActions;

export const useWarmthStore = create<WarmthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      enabled: false,
      globalCounter: 0,
      nodeInteractions: {},
      maxHistory: 25,

      toggleEnabled: () => {
        set((state) => ({ enabled: !state.enabled }));
      },

      recordInteraction: (nodeId: string) => {
        set((state) => {
          const newCounter = state.globalCounter + 1;
          return {
            globalCounter: newCounter,
            nodeInteractions: {
              ...state.nodeInteractions,
              [nodeId]: newCounter,
            },
          };
        });
      },

      getWarmth: (nodeId: string) => {
        const state = get();
        const lastInteraction = state.nodeInteractions[nodeId];

        // Never opened = coldest (0)
        if (lastInteraction === undefined) {
          return 0;
        }

        // Calculate age (how many interactions ago)
        const age = state.globalCounter - lastInteraction;

        // Warmth decays linearly over maxHistory interactions
        // age 0 = warmth 1.0, age >= maxHistory = warmth 0.0
        const warmth = Math.max(0, 1 - (age / state.maxHistory));

        return warmth;
      },

      resetWarmth: () => {
        set({
          globalCounter: 0,
          nodeInteractions: {},
        });
      },
    }),
    {
      name: 'principle-warmth-storage',
      partialize: (state) => ({
        enabled: state.enabled,
        globalCounter: state.globalCounter,
        nodeInteractions: state.nodeInteractions,
        // maxHistory is NOT persisted - always use the code default (25)
      }),
    }
  )
);
