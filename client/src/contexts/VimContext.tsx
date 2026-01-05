import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { VimState, VimMode, Operator, VimCommand, createInitialVimState, VimAction } from '../types/vim.types';
import { vimStateReducer } from '../services/vimState';
import { ConceptMapNode, ConceptMapEdge } from '../types';

interface VimContextValue {
  state: VimState;

  // Mode transitions
  setMode: (mode: VimMode) => void;
  enterNormalMode: () => void;
  enterInsertMode: () => void;
  enterVisualMode: () => void;
  enterCommandMode: () => void;
  enterMoveMode: () => void;

  // Focus and selection
  setFocus: (nodeId: string | null) => void;
  focusNode: (nodeId: string) => void;
  addSelection: (nodeId: string) => void;
  removeSelection: (nodeId: string) => void;
  setSelection: (nodeIds: string[]) => void;
  clearSelection: () => void;

  // Command buffer
  appendCommandBuffer: (char: string) => void;
  clearCommandBuffer: () => void;

  // Operators
  setOperatorPending: (operator: Operator | null) => void;

  // Yank register
  setYankRegister: (nodes: ConceptMapNode[], edges: ConceptMapEdge[]) => void;
  yankNodes: (nodes: ConceptMapNode[], edges?: ConceptMapEdge[]) => void;

  // Marks
  setMark: (mark: string, nodeId: string) => void;
  jumpToMark: (mark: string) => void;

  // Navigation history
  addToHistory: (nodeId: string) => void;
  goBack: () => void;
  goForward: () => void;

  // Edge mode
  startEdgeMode: (sourceNodeId: string) => void;
  setEdgeTarget: (targetNodeId: string | null) => void;
  exitEdgeMode: () => void;

  // Edge edit mode
  startEdgeEditMode: (nodeId: string, edgeIds: string[]) => void;
  selectNextEdge: () => void;
  selectPrevEdge: () => void;
  exitEdgeEditMode: () => void;

  // Search
  startSearch: (query: string) => void;
  setSearchResults: (results: string[]) => void;
  nextSearchResult: () => void;
  prevSearchResult: () => void;
  exitSearch: () => void;

  // Command mode
  setCommandInput: (input: string) => void;

  // Visual mode
  setVisualAnchor: (nodeId: string | null) => void;

  // Last operation
  setLastOperation: (operation: VimCommand) => void;

  // Editor modal
  openEditor: (nodeId: string) => void;
  closeEditor: () => void;

  // Edge label editor
  openEdgeLabelEditor: (edgeId: string) => void;
  closeEdgeLabelEditor: () => void;

  // Edge type selector
  openEdgeTypeSelector: (edgeId: string) => void;
  closeEdgeTypeSelector: () => void;

  // Tag input
  openTagInput: () => void;
  closeTagInput: () => void;

  // Paste shape selector
  openPasteShapeSelector: (count: number, asConnected: boolean) => void;
  closePasteShapeSelector: () => void;

  // Portal creator
  openPortalCreator: () => void;
  closePortalCreator: () => void;

  // Layout options selector
  openLayoutOptionsSelector: () => void;
  closeLayoutOptionsSelector: () => void;

  // Settings
  toggleEnabled: () => void;

  // Reset
  reset: () => void;
}

const VimContext = createContext<VimContextValue | null>(null);

export const VimProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(vimStateReducer, createInitialVimState());

  // Mode transitions
  const setMode = useCallback((mode: VimMode) => dispatch({ type: 'SET_MODE', mode }), []);
  const enterNormalMode = useCallback(() => dispatch({ type: 'SET_MODE', mode: 'normal' }), []);
  const enterInsertMode = useCallback(() => dispatch({ type: 'SET_MODE', mode: 'insert' }), []);
  const enterVisualMode = useCallback(() => {
    dispatch({ type: 'SET_MODE', mode: 'visual' });
    // Set anchor to currently focused node and add it to selection
    if (state.focusedNodeId) {
      dispatch({ type: 'SET_VISUAL_ANCHOR', nodeId: state.focusedNodeId });
      dispatch({ type: 'ADD_SELECTION', nodeId: state.focusedNodeId });
    }
  }, [state.focusedNodeId]);
  const enterCommandMode = useCallback(() => dispatch({ type: 'SET_MODE', mode: 'command' }), []);
  const enterMoveMode = useCallback(() => dispatch({ type: 'SET_MODE', mode: 'move' }), []);

  // Focus and selection
  const setFocus = useCallback((nodeId: string | null) => dispatch({ type: 'SET_FOCUS', nodeId }), []);
  const focusNode = useCallback((nodeId: string) => dispatch({ type: 'SET_FOCUS', nodeId }), []);
  const addSelection = useCallback((nodeId: string) => dispatch({ type: 'ADD_SELECTION', nodeId }), []);
  const removeSelection = useCallback((nodeId: string) => dispatch({ type: 'REMOVE_SELECTION', nodeId }), []);
  const setSelection = useCallback((nodeIds: string[]) => dispatch({ type: 'SET_SELECTION', nodeIds }), []);
  const clearSelection = useCallback(() => dispatch({ type: 'CLEAR_SELECTION' }), []);

  // Command buffer
  const appendCommandBuffer = useCallback((char: string) => dispatch({ type: 'APPEND_COMMAND_BUFFER', char }), []);
  const clearCommandBuffer = useCallback(() => dispatch({ type: 'CLEAR_COMMAND_BUFFER' }), []);

  // Operators
  const setOperatorPending = useCallback((operator: Operator | null) => dispatch({ type: 'SET_OPERATOR_PENDING', operator }), []);

  // Yank register
  const setYankRegister = useCallback((nodes: ConceptMapNode[], edges: ConceptMapEdge[]) => dispatch({ type: 'SET_YANK_REGISTER', nodes, edges }), []);
  const yankNodes = useCallback((nodes: ConceptMapNode[], edges: ConceptMapEdge[] = []) => dispatch({ type: 'SET_YANK_REGISTER', nodes, edges }), []);

  // Marks
  const setMark = useCallback((mark: string, nodeId: string) => dispatch({ type: 'SET_MARK', mark, nodeId }), []);
  const jumpToMark = useCallback((mark: string) => {
    const nodeId = state.marks.get(mark);
    if (nodeId) {
      dispatch({ type: 'SET_FOCUS', nodeId });
    }
  }, [state.marks]);

  // Navigation history
  const addToHistory = useCallback((nodeId: string) => dispatch({ type: 'ADD_TO_HISTORY', nodeId }), []);
  const goBack = useCallback(() => dispatch({ type: 'HISTORY_BACK' }), []);
  const goForward = useCallback(() => dispatch({ type: 'HISTORY_FORWARD' }), []);

  // Edge mode
  const startEdgeMode = useCallback((sourceNodeId: string) => dispatch({ type: 'START_EDGE_MODE', sourceNodeId }), []);
  const setEdgeTarget = useCallback((targetNodeId: string | null) => dispatch({ type: 'SET_EDGE_TARGET', targetNodeId }), []);
  const exitEdgeMode = useCallback(() => dispatch({ type: 'EXIT_EDGE_MODE' }), []);

  // Edge edit mode
  const startEdgeEditMode = useCallback((nodeId: string, edgeIds: string[]) => dispatch({ type: 'START_EDGE_EDIT_MODE', nodeId, edgeIds }), []);
  const selectNextEdge = useCallback(() => dispatch({ type: 'SELECT_NEXT_EDGE' }), []);
  const selectPrevEdge = useCallback(() => dispatch({ type: 'SELECT_PREV_EDGE' }), []);
  const exitEdgeEditMode = useCallback(() => dispatch({ type: 'EXIT_EDGE_EDIT_MODE' }), []);

  // Search
  const startSearch = useCallback((query: string) => dispatch({ type: 'START_SEARCH', query }), []);
  const setSearchResults = useCallback((results: string[]) => dispatch({ type: 'SET_SEARCH_RESULTS', results }), []);
  const nextSearchResult = useCallback(() => dispatch({ type: 'NEXT_SEARCH_RESULT' }), []);
  const prevSearchResult = useCallback(() => dispatch({ type: 'PREV_SEARCH_RESULT' }), []);
  const exitSearch = useCallback(() => dispatch({ type: 'EXIT_SEARCH' }), []);

  // Command mode
  const setCommandInput = useCallback((input: string) => dispatch({ type: 'SET_COMMAND_INPUT', input }), []);

  // Visual mode
  const setVisualAnchor = useCallback((nodeId: string | null) => dispatch({ type: 'SET_VISUAL_ANCHOR', nodeId }), []);

  // Last operation
  const setLastOperation = useCallback((operation: VimCommand) => dispatch({ type: 'SET_LAST_OPERATION', operation }), []);

  // Editor modal
  const openEditor = useCallback((nodeId: string) => dispatch({ type: 'OPEN_EDITOR', nodeId }), []);
  const closeEditor = useCallback(() => dispatch({ type: 'CLOSE_EDITOR' }), []);

  // Edge label editor
  const openEdgeLabelEditor = useCallback((edgeId: string) => dispatch({ type: 'OPEN_EDGE_LABEL_EDITOR', edgeId }), []);
  const closeEdgeLabelEditor = useCallback(() => dispatch({ type: 'CLOSE_EDGE_LABEL_EDITOR' }), []);

  // Edge type selector
  const openEdgeTypeSelector = useCallback((edgeId: string) => dispatch({ type: 'OPEN_EDGE_TYPE_SELECTOR', edgeId }), []);
  const closeEdgeTypeSelector = useCallback(() => dispatch({ type: 'CLOSE_EDGE_TYPE_SELECTOR' }), []);

  // Tag input
  const openTagInput = useCallback(() => dispatch({ type: 'OPEN_TAG_INPUT' }), []);
  const closeTagInput = useCallback(() => dispatch({ type: 'CLOSE_TAG_INPUT' }), []);

  // Paste shape selector
  const openPasteShapeSelector = useCallback((count: number, asConnected: boolean) => dispatch({ type: 'OPEN_PASTE_SHAPE_SELECTOR', count, asConnected }), []);
  const closePasteShapeSelector = useCallback(() => dispatch({ type: 'CLOSE_PASTE_SHAPE_SELECTOR' }), []);

  // Portal creator
  const openPortalCreator = useCallback(() => dispatch({ type: 'OPEN_PORTAL_CREATOR' }), []);
  const closePortalCreator = useCallback(() => dispatch({ type: 'CLOSE_PORTAL_CREATOR' }), []);

  // Layout options selector
  const openLayoutOptionsSelector = useCallback(() => dispatch({ type: 'OPEN_LAYOUT_OPTIONS_SELECTOR' }), []);
  const closeLayoutOptionsSelector = useCallback(() => dispatch({ type: 'CLOSE_LAYOUT_OPTIONS_SELECTOR' }), []);

  // Settings
  const toggleEnabled = useCallback(() => dispatch({ type: 'TOGGLE_ENABLED' }), []);

  // Reset
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const value = useMemo(() => ({
    state,
    setMode,
    enterNormalMode,
    enterInsertMode,
    enterVisualMode,
    enterCommandMode,
    enterMoveMode,
    setFocus,
    focusNode,
    addSelection,
    removeSelection,
    setSelection,
    clearSelection,
    appendCommandBuffer,
    clearCommandBuffer,
    setOperatorPending,
    setYankRegister,
    yankNodes,
    setMark,
    jumpToMark,
    addToHistory,
    goBack,
    goForward,
    startEdgeMode,
    setEdgeTarget,
    exitEdgeMode,
    startEdgeEditMode,
    selectNextEdge,
    selectPrevEdge,
    exitEdgeEditMode,
    startSearch,
    setSearchResults,
    nextSearchResult,
    prevSearchResult,
    exitSearch,
    setCommandInput,
    setVisualAnchor,
    setLastOperation,
    openEditor,
    closeEditor,
    openEdgeLabelEditor,
    closeEdgeLabelEditor,
    openEdgeTypeSelector,
    closeEdgeTypeSelector,
    openTagInput,
    closeTagInput,
    openPasteShapeSelector,
    closePasteShapeSelector,
    openPortalCreator,
    closePortalCreator,
    openLayoutOptionsSelector,
    closeLayoutOptionsSelector,
    toggleEnabled,
    reset
  }), [
    state,
    setMode,
    enterNormalMode,
    enterInsertMode,
    enterVisualMode,
    enterCommandMode,
    enterMoveMode,
    setFocus,
    focusNode,
    addSelection,
    removeSelection,
    setSelection,
    clearSelection,
    appendCommandBuffer,
    clearCommandBuffer,
    setOperatorPending,
    setYankRegister,
    yankNodes,
    setMark,
    jumpToMark,
    addToHistory,
    goBack,
    goForward,
    startEdgeMode,
    setEdgeTarget,
    exitEdgeMode,
    startEdgeEditMode,
    selectNextEdge,
    selectPrevEdge,
    exitEdgeEditMode,
    startSearch,
    setSearchResults,
    nextSearchResult,
    prevSearchResult,
    exitSearch,
    setCommandInput,
    setVisualAnchor,
    setLastOperation,
    openEditor,
    closeEditor,
    openEdgeLabelEditor,
    closeEdgeLabelEditor,
    openEdgeTypeSelector,
    closeEdgeTypeSelector,
    openTagInput,
    closeTagInput,
    openPasteShapeSelector,
    closePasteShapeSelector,
    openPortalCreator,
    closePortalCreator,
    openLayoutOptionsSelector,
    closeLayoutOptionsSelector,
    toggleEnabled,
    reset
  ]);

  return <VimContext.Provider value={value}>{children}</VimContext.Provider>;
};

export const useVim = (): VimContextValue => {
  const context = useContext(VimContext);
  if (!context) {
    throw new Error('useVim must be used within a VimProvider');
  }
  return context;
};
