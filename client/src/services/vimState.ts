import { VimState, VimAction, createInitialVimState } from '../types/vim.types';

/**
 * Vim state reducer
 * Manages all vim state transitions
 */
export const vimStateReducer = (state: VimState, action: VimAction): VimState => {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.mode,
        // Clear command buffer and operator when changing modes
        commandBuffer: '',
        operatorPending: null,
        // Clear command input when leaving command mode
        commandInput: action.mode === 'command' ? state.commandInput : ''
      };

    case 'SET_FOCUS': {
      // Add to navigation history when focusing a different node
      if (action.nodeId && action.nodeId !== state.focusedNodeId) {
        const newHistory = [...state.navigationHistory.nodeIds.slice(0, state.navigationHistory.currentIndex + 1)];
        newHistory.push(action.nodeId);

        return {
          ...state,
          focusedNodeId: action.nodeId,
          navigationHistory: {
            nodeIds: newHistory,
            currentIndex: newHistory.length - 1
          }
        };
      }

      return {
        ...state,
        focusedNodeId: action.nodeId
      };
    }

    case 'ADD_SELECTION': {
      const newSelection = new Set(state.selectedNodeIds);
      newSelection.add(action.nodeId);
      return { ...state, selectedNodeIds: newSelection };
    }

    case 'REMOVE_SELECTION': {
      const newSelection = new Set(state.selectedNodeIds);
      newSelection.delete(action.nodeId);
      return { ...state, selectedNodeIds: newSelection };
    }

    case 'SET_SELECTION':
      return { ...state, selectedNodeIds: new Set(action.nodeIds) };

    case 'CLEAR_SELECTION':
      return { ...state, selectedNodeIds: new Set() };

    case 'APPEND_COMMAND_BUFFER':
      return { ...state, commandBuffer: state.commandBuffer + action.char };

    case 'CLEAR_COMMAND_BUFFER':
      return { ...state, commandBuffer: '', operatorPending: null, pendingCount: 0 };

    case 'SET_OPERATOR_PENDING':
      return { ...state, operatorPending: action.operator };

    case 'SET_YANK_REGISTER':
      return {
        ...state,
        yankRegister: {
          nodes: action.nodes,
          edges: action.edges,
          timestamp: Date.now()
        }
      };

    case 'SET_MARK': {
      const newMarks = new Map(state.marks);
      newMarks.set(action.mark, action.nodeId);
      return { ...state, marks: newMarks };
    }

    case 'ADD_TO_HISTORY': {
      const newHistory = [...state.navigationHistory.nodeIds.slice(0, state.navigationHistory.currentIndex + 1)];
      newHistory.push(action.nodeId);
      return {
        ...state,
        navigationHistory: {
          nodeIds: newHistory,
          currentIndex: newHistory.length - 1
        }
      };
    }

    case 'HISTORY_BACK': {
      if (state.navigationHistory.currentIndex > 0) {
        const newIndex = state.navigationHistory.currentIndex - 1;
        return {
          ...state,
          focusedNodeId: state.navigationHistory.nodeIds[newIndex],
          navigationHistory: {
            ...state.navigationHistory,
            currentIndex: newIndex
          }
        };
      }
      return state;
    }

    case 'HISTORY_FORWARD': {
      if (state.navigationHistory.currentIndex < state.navigationHistory.nodeIds.length - 1) {
        const newIndex = state.navigationHistory.currentIndex + 1;
        return {
          ...state,
          focusedNodeId: state.navigationHistory.nodeIds[newIndex],
          navigationHistory: {
            ...state.navigationHistory,
            currentIndex: newIndex
          }
        };
      }
      return state;
    }

    case 'START_EDGE_MODE':
      return {
        ...state,
        mode: 'edge',
        edgeMode: {
          active: true,
          sourceNodeId: action.sourceNodeId,
          targetNodeId: null
        }
      };

    case 'SET_EDGE_TARGET':
      return {
        ...state,
        edgeMode: {
          ...state.edgeMode,
          targetNodeId: action.targetNodeId
        }
      };

    case 'EXIT_EDGE_MODE':
      return {
        ...state,
        mode: 'normal',
        edgeMode: {
          active: false,
          sourceNodeId: null,
          targetNodeId: null
        }
      };

    case 'START_EDGE_EDIT_MODE':
      return {
        ...state,
        mode: 'edgeEdit',
        edgeEditMode: {
          active: true,
          nodeId: action.nodeId,
          edgeIds: action.edgeIds,
          selectedIndex: action.edgeIds.length > 0 ? 0 : -1
        }
      };

    case 'SELECT_NEXT_EDGE': {
      const { edgeIds, selectedIndex } = state.edgeEditMode;
      if (edgeIds.length === 0) return state;

      const nextIndex = (selectedIndex + 1) % edgeIds.length;
      return {
        ...state,
        edgeEditMode: {
          ...state.edgeEditMode,
          selectedIndex: nextIndex
        }
      };
    }

    case 'SELECT_PREV_EDGE': {
      const { edgeIds, selectedIndex } = state.edgeEditMode;
      if (edgeIds.length === 0) return state;

      const prevIndex = (selectedIndex - 1 + edgeIds.length) % edgeIds.length;
      return {
        ...state,
        edgeEditMode: {
          ...state.edgeEditMode,
          selectedIndex: prevIndex
        }
      };
    }

    case 'EXIT_EDGE_EDIT_MODE':
      return {
        ...state,
        mode: 'normal',
        edgeEditMode: {
          active: false,
          nodeId: null,
          edgeIds: [],
          selectedIndex: 0
        }
      };

    case 'START_SEARCH':
      return {
        ...state,
        mode: 'command', // Search uses command mode UI
        search: {
          query: action.query,
          results: [],
          currentIndex: -1,
          active: true
        }
      };

    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        search: {
          ...state.search,
          results: action.results,
          currentIndex: action.results.length > 0 ? 0 : -1
        },
        // Focus first result
        focusedNodeId: action.results.length > 0 ? action.results[0] : state.focusedNodeId
      };

    case 'NEXT_SEARCH_RESULT': {
      const { results, currentIndex } = state.search;
      if (results.length === 0) return state;

      const nextIndex = (currentIndex + 1) % results.length;
      return {
        ...state,
        search: {
          ...state.search,
          currentIndex: nextIndex
        },
        focusedNodeId: results[nextIndex]
      };
    }

    case 'PREV_SEARCH_RESULT': {
      const { results, currentIndex } = state.search;
      if (results.length === 0) return state;

      const prevIndex = (currentIndex - 1 + results.length) % results.length;
      return {
        ...state,
        search: {
          ...state.search,
          currentIndex: prevIndex
        },
        focusedNodeId: results[prevIndex]
      };
    }

    case 'EXIT_SEARCH':
      return {
        ...state,
        mode: 'normal',
        search: {
          query: '',
          results: [],
          currentIndex: -1,
          active: false
        }
      };

    case 'SET_COMMAND_INPUT':
      return { ...state, commandInput: action.input };

    case 'SET_VISUAL_ANCHOR':
      return { ...state, visualModeAnchor: action.nodeId };

    case 'SET_LAST_OPERATION':
      return { ...state, lastOperation: action.operation };

    case 'OPEN_EDITOR':
      return { ...state, editorNodeId: action.nodeId };

    case 'CLOSE_EDITOR':
      return { ...state, editorNodeId: null };

    case 'OPEN_EDGE_LABEL_EDITOR':
      return { ...state, edgeLabelEditorId: action.edgeId };

    case 'CLOSE_EDGE_LABEL_EDITOR':
      return { ...state, edgeLabelEditorId: null };

    case 'OPEN_EDGE_TYPE_SELECTOR':
      return { ...state, edgeTypeSelectorId: action.edgeId };

    case 'CLOSE_EDGE_TYPE_SELECTOR':
      return { ...state, edgeTypeSelectorId: null };

    case 'OPEN_TAG_INPUT':
      return { ...state, tagInputOpen: true };

    case 'CLOSE_TAG_INPUT':
      return { ...state, tagInputOpen: false };

    case 'OPEN_PASTE_SHAPE_SELECTOR':
      return {
        ...state,
        pasteShapeSelectorOpen: true,
        pasteCount: action.count,
        pasteAsConnected: action.asConnected
      };

    case 'CLOSE_PASTE_SHAPE_SELECTOR':
      return {
        ...state,
        pasteShapeSelectorOpen: false,
        pasteCount: 1,
        pasteAsConnected: false
      };

    case 'OPEN_PORTAL_CREATOR':
      return { ...state, portalCreatorOpen: true };

    case 'CLOSE_PORTAL_CREATOR':
      return { ...state, portalCreatorOpen: false };

    case 'OPEN_LAYOUT_OPTIONS_SELECTOR':
      return { ...state, layoutOptionsSelectorOpen: true };

    case 'CLOSE_LAYOUT_OPTIONS_SELECTOR':
      return { ...state, layoutOptionsSelectorOpen: false };

    case 'TOGGLE_ENABLED':
      return { ...state, enabled: !state.enabled };

    case 'RESET':
      return createInitialVimState();

    default:
      return state;
  }
};
