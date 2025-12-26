import { ConceptMapNode, ConceptMapEdge } from './index';

// Vim modes
export type VimMode = 'normal' | 'insert' | 'visual' | 'edge' | 'edgeEdit' | 'command' | 'move';

// Operators for operator-pending mode
export type Operator = 'd' | 'y' | 'c' | 's' | 'e';

// Graph objects (like vim text objects)
export type GraphObject = 'n' | 'c' | 't' | 's' | 'a';

// Command types
export interface VimCommand {
  operator?: Operator;
  object?: GraphObject;
  count?: number;
  raw: string;
}

// Yank register for copy/paste
export interface YankRegister {
  nodes: ConceptMapNode[];
  edges: ConceptMapEdge[];
  timestamp: number;
}

// Edge mode state
export interface EdgeModeState {
  active: boolean;
  sourceNodeId: string | null;
  targetNodeId: string | null;
}

// Edge edit mode state
export interface EdgeEditModeState {
  active: boolean;
  nodeId: string | null;        // Node whose edges we're editing
  edgeIds: string[];             // IDs of edges connected to the node
  selectedIndex: number;         // Currently selected edge index
}

// Navigation history
export interface NavigationHistory {
  nodeIds: string[];
  currentIndex: number;
}

// Search state
export interface SearchState {
  query: string;
  results: string[];
  currentIndex: number;
  active: boolean;
}

// Complete vim state
export interface VimState {
  // Current mode
  mode: VimMode;

  // Node focus and selection
  focusedNodeId: string | null;
  selectedNodeIds: Set<string>;

  // Command buffering for multi-key commands
  commandBuffer: string;
  operatorPending: Operator | null;
  pendingCount: number;

  // Copy/paste register
  yankRegister: YankRegister;

  // Marks (a-z -> node id)
  marks: Map<string, string>;

  // Navigation history for Ctrl+o/Ctrl+i
  navigationHistory: NavigationHistory;

  // Edge mode
  edgeMode: EdgeModeState;

  // Edge edit mode
  edgeEditMode: EdgeEditModeState;

  // Search
  search: SearchState;

  // Command mode
  commandInput: string;

  // Visual mode
  visualModeAnchor: string | null; // Node where visual selection started

  // Last operation for repeat (.)
  lastOperation: VimCommand | null;

  // Editor modal state
  editorNodeId: string | null; // Node ID whose editor should be open

  // Edge label editor state
  edgeLabelEditorId: string | null; // Edge ID whose label is being edited

  // Tag input state
  tagInputOpen: boolean; // Whether tag input is open

  // Settings
  enabled: boolean; // Toggle vim mode on/off
}

// Initial state factory
export const createInitialVimState = (): VimState => ({
  mode: 'normal',
  focusedNodeId: null,
  selectedNodeIds: new Set(),
  commandBuffer: '',
  operatorPending: null,
  pendingCount: 0,
  yankRegister: {
    nodes: [],
    edges: [],
    timestamp: 0
  },
  marks: new Map(),
  navigationHistory: {
    nodeIds: [],
    currentIndex: -1
  },
  edgeMode: {
    active: false,
    sourceNodeId: null,
    targetNodeId: null
  },
  edgeEditMode: {
    active: false,
    nodeId: null,
    edgeIds: [],
    selectedIndex: 0
  },
  search: {
    query: '',
    results: [],
    currentIndex: -1,
    active: false
  },
  commandInput: '',
  visualModeAnchor: null,
  lastOperation: null,
  editorNodeId: null,
  edgeLabelEditorId: null,
  tagInputOpen: false,
  enabled: true
});

// Keyboard event data
export interface VimKeyEvent {
  key: string;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
  alt: boolean;
}

// Action types for vim state reducer
export type VimAction =
  | { type: 'SET_MODE'; mode: VimMode }
  | { type: 'SET_FOCUS'; nodeId: string | null }
  | { type: 'ADD_SELECTION'; nodeId: string }
  | { type: 'REMOVE_SELECTION'; nodeId: string }
  | { type: 'SET_SELECTION'; nodeIds: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'APPEND_COMMAND_BUFFER'; char: string }
  | { type: 'CLEAR_COMMAND_BUFFER' }
  | { type: 'SET_OPERATOR_PENDING'; operator: Operator | null }
  | { type: 'SET_YANK_REGISTER'; nodes: ConceptMapNode[]; edges: ConceptMapEdge[] }
  | { type: 'SET_MARK'; mark: string; nodeId: string }
  | { type: 'ADD_TO_HISTORY'; nodeId: string }
  | { type: 'HISTORY_BACK' }
  | { type: 'HISTORY_FORWARD' }
  | { type: 'START_EDGE_MODE'; sourceNodeId: string }
  | { type: 'SET_EDGE_TARGET'; targetNodeId: string | null }
  | { type: 'EXIT_EDGE_MODE' }
  | { type: 'START_EDGE_EDIT_MODE'; nodeId: string; edgeIds: string[] }
  | { type: 'SELECT_NEXT_EDGE' }
  | { type: 'SELECT_PREV_EDGE' }
  | { type: 'EXIT_EDGE_EDIT_MODE' }
  | { type: 'START_SEARCH'; query: string }
  | { type: 'SET_SEARCH_RESULTS'; results: string[] }
  | { type: 'NEXT_SEARCH_RESULT' }
  | { type: 'PREV_SEARCH_RESULT' }
  | { type: 'EXIT_SEARCH' }
  | { type: 'SET_COMMAND_INPUT'; input: string }
  | { type: 'SET_VISUAL_ANCHOR'; nodeId: string | null }
  | { type: 'SET_LAST_OPERATION'; operation: VimCommand }
  | { type: 'OPEN_EDITOR'; nodeId: string }
  | { type: 'CLOSE_EDITOR' }
  | { type: 'OPEN_EDGE_LABEL_EDITOR'; edgeId: string }
  | { type: 'CLOSE_EDGE_LABEL_EDITOR' }
  | { type: 'OPEN_TAG_INPUT' }
  | { type: 'CLOSE_TAG_INPUT' }
  | { type: 'TOGGLE_ENABLED' }
  | { type: 'RESET' };
