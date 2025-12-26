import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ColorTheme, ThemeColors, NodeColorOverride } from '../types/theme';

interface ThemeStore {
  // State
  currentTheme: ColorTheme;
  customThemes: ColorTheme[];
  presetThemes: ColorTheme[];
  nodeOverrides: Map<string, NodeColorOverride>;

  // Theme management
  setTheme: (themeId: string) => void;
  createCustomTheme: (name: string, colors: Partial<ThemeColors>) => ColorTheme;
  updateTheme: (themeId: string, colors: Partial<ThemeColors>) => void;
  deleteTheme: (themeId: string) => void;

  // Node overrides
  setNodeColorOverride: (nodeId: string, colors: Partial<NodeColorOverride>) => void;
  clearNodeColorOverride: (nodeId: string) => void;

  // Import/Export
  exportTheme: (themeId: string) => string;
  importTheme: (json: string) => ColorTheme;
}

// ============================================================================
// PRESET THEMES
// ============================================================================

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
    tagColors: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'],
  },
  createdAt: new Date().toISOString(),
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
    tagColors: ['#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#f87171', '#22d3ee', '#c084fc'],
  },
  createdAt: new Date().toISOString(),
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
    tagColors: ['#268bd2', '#2aa198', '#859900', '#b58900', '#cb4b16', '#dc322f', '#d33682', '#6c71c4'],
  },
  createdAt: new Date().toISOString(),
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
    tagColors: ['#ff79c6', '#bd93f9', '#8be9fd', '#50fa7b', '#f1fa8c', '#ffb86c', '#ff5555', '#6272a4'],
  },
  createdAt: new Date().toISOString(),
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
    tagColors: ['#88c0d0', '#81a1c1', '#5e81ac', '#b48ead', '#a3be8c', '#ebcb8b', '#d08770', '#bf616a'],
  },
  createdAt: new Date().toISOString(),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function applyThemeToDOM(theme: ColorTheme) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    if (typeof value === 'string') {
      root.style.setProperty(`--theme-${key}`, value);
    } else if (Array.isArray(value)) {
      // Handle tag colors array
      value.forEach((color, index) => {
        root.style.setProperty(`--theme-${key}-${index}`, color);
      });
    }
  });
}

// ============================================================================
// STORE
// ============================================================================

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: LIGHT_THEME,
      customThemes: [],
      presetThemes: [LIGHT_THEME, DARK_THEME, SOLARIZED_LIGHT, DRACULA_THEME, NORD_THEME],
      nodeOverrides: new Map(),

      setTheme: (themeId: string) => {
        const { presetThemes, customThemes } = get();
        const theme = [...presetThemes, ...customThemes].find((t) => t.id === themeId);
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
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          customThemes: [...state.customThemes, newTheme],
          currentTheme: newTheme,
        }));

        applyThemeToDOM(newTheme);
        return newTheme;
      },

      updateTheme: (themeId: string, colors: Partial<ThemeColors>) => {
        set((state) => ({
          customThemes: state.customThemes.map((t) =>
            t.id === themeId ? { ...t, colors: { ...t.colors, ...colors } } : t
          ),
          currentTheme:
            state.currentTheme.id === themeId
              ? { ...state.currentTheme, colors: { ...state.currentTheme.colors, ...colors } }
              : state.currentTheme,
        }));

        if (get().currentTheme.id === themeId) {
          applyThemeToDOM(get().currentTheme);
        }
      },

      deleteTheme: (themeId: string) => {
        set((state) => {
          const customThemes = state.customThemes.filter((t) => t.id !== themeId);
          const currentTheme = state.currentTheme.id === themeId ? LIGHT_THEME : state.currentTheme;

          if (state.currentTheme.id === themeId) {
            applyThemeToDOM(LIGHT_THEME);
          }

          return { customThemes, currentTheme };
        });
      },

      setNodeColorOverride: (nodeId: string, colors: Partial<NodeColorOverride>) => {
        set((state) => {
          const nodeOverrides = new Map(state.nodeOverrides);
          const existing = nodeOverrides.get(nodeId) || { nodeId };
          nodeOverrides.set(nodeId, { ...existing, ...colors });
          return { nodeOverrides };
        });
      },

      clearNodeColorOverride: (nodeId: string) => {
        set((state) => {
          const nodeOverrides = new Map(state.nodeOverrides);
          nodeOverrides.delete(nodeId);
          return { nodeOverrides };
        });
      },

      exportTheme: (themeId: string) => {
        const { presetThemes, customThemes } = get();
        const theme = [...presetThemes, ...customThemes].find((t) => t.id === themeId);
        return theme ? JSON.stringify(theme, null, 2) : '';
      },

      importTheme: (json: string) => {
        try {
          const theme: ColorTheme = JSON.parse(json);
          theme.id = `imported-${Date.now()}`;
          theme.isPreset = false;

          set((state) => ({
            customThemes: [...state.customThemes, theme],
          }));

          return theme;
        } catch (error) {
          throw new Error('Invalid theme JSON');
        }
      },
    }),
    {
      name: 'principle-theme-storage',
      serialize: (state) =>
        JSON.stringify({
          ...state.state,
          nodeOverrides: Array.from(state.state.nodeOverrides.entries()),
        }),
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          state: {
            ...parsed,
            nodeOverrides: new Map(parsed.nodeOverrides || []),
          },
        };
      },
    }
  )
);

// Apply current theme on store initialization
const initialTheme = useThemeStore.getState().currentTheme;
applyThemeToDOM(initialTheme);
