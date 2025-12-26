import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConceptMapNode, Tag } from '../types';

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

  /** Reverse index: tag name -> set of node IDs */
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

  /**
   * Set filter mode directly
   */
  setTagMode: (mode: 'AND' | 'OR') => void;

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
 *
 * Performance optimizations:
 * - Uses Map for O(1) tag lookups
 * - Uses Set for O(1) node ID operations
 * - Debounced autocomplete (handled in UI components)
 * - Efficient filtering with early exits
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
        set(() => {
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

      setTagMode: (mode: 'AND' | 'OR') => {
        set({ tagMode: mode });
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
