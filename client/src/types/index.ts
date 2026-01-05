export interface Position {
  x: number;
  y: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface ConceptMap {
  id: string;
  name: string;
  description?: string;
  viewport: Viewport;
  createdAt: string;
  updatedAt: string;
  nodes?: ConceptMapNode[];
}

export interface ConceptMapNode {
  id: string;
  conceptMapId: string;
  title: string;
  content: any;
  position: Position;
  style: any;
  shape: string;
  imageIds: string[];
  tags: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // Portal-specific fields
  nodeType: 'regular' | 'portal';
  portalTargetMapId?: string;
  portalTargetNodeId?: string;
  portalSourceMapId?: string;
  portalSourceNodeId?: string;
}

export interface CreateConceptMapInput {
  name: string;
  description?: string;
}

export interface CreateNodeInput {
  conceptMapId: string;
  title: string;
  position: Position;
  content?: any;
  style?: any;
  shape?: string;
  nodeType?: 'regular' | 'portal';
  portalTargetMapId?: string;
  portalTargetNodeId?: string;
  portalSourceMapId?: string;
  portalSourceNodeId?: string;
}

export interface UpdateNodeInput {
  title?: string;
  content?: any;
  position?: Position;
  style?: any;
  shape?: string;
}

export interface EdgeStyle {
  strokeColor?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  animated?: boolean;
  type?: 'default' | 'straight' | 'step' | 'smoothstep' | 'direct';
  markerEnd?: 'arrow' | 'arrowclosed' | 'none';
  markerStart?: 'arrow' | 'arrowclosed' | 'none';
  edgeType?: string; // Preset ID
}

export interface ConceptMapEdge {
  id: string;
  conceptMapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandleId?: string;
  targetHandleId?: string;
  label?: string;
  style: EdgeStyle;
  createdAt: string;
}

export interface CreateEdgeInput {
  id?: string; // Optional - used for undo/redo to preserve IDs
  conceptMapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandleId?: string;
  targetHandleId?: string;
  label?: string;
  style?: EdgeStyle;
}

export interface UpdateEdgeInput {
  label?: string;
  style?: EdgeStyle;
}

export interface EdgeTypePreset {
  id: string;
  name: string;
  description: string;
  style: EdgeStyle;
}

export const EDGE_TYPE_PRESETS: EdgeTypePreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Neutral connection',
    style: { strokeColor: '#b1b1b7', strokeWidth: 2, markerEnd: 'arrow' }
  },
  {
    id: 'causes',
    name: 'Causes',
    description: 'Causal relationship',
    style: { strokeColor: '#ef4444', strokeWidth: 2, markerEnd: 'arrowclosed' }
  },
  {
    id: 'supports',
    name: 'Supports',
    description: 'Supportive relationship',
    style: { strokeColor: '#22c55e', strokeWidth: 2, markerEnd: 'arrowclosed' }
  },
  {
    id: 'contradicts',
    name: 'Contradicts',
    description: 'Contradictory relationship',
    style: { strokeColor: '#f59e0b', strokeWidth: 2, strokeDasharray: '5 5', markerEnd: 'arrowclosed' }
  },
  {
    id: 'influences',
    name: 'Influences',
    description: 'Indirect influence',
    style: { strokeColor: '#3b82f6', strokeWidth: 2, strokeDasharray: '3 3', markerEnd: 'arrow' }
  },
  {
    id: 'bidirectional',
    name: 'Bidirectional',
    description: 'Mutual relationship',
    style: { strokeColor: '#8b5cf6', strokeWidth: 2, markerEnd: 'arrowclosed', markerStart: 'arrowclosed' }
  },
  {
    id: 'relates',
    name: 'Relates',
    description: 'General relationship',
    style: { strokeColor: '#64748b', strokeWidth: 2, markerEnd: 'none' }
  }
];

// Edge path style options (controls the line shape)
export interface EdgePathStyle {
  id: 'default' | 'straight' | 'step' | 'smoothstep' | 'direct';
  name: string;
  description: string;
}

export const EDGE_PATH_STYLES: EdgePathStyle[] = [
  { id: 'default', name: 'Curved', description: 'Smooth bezier curve' },
  { id: 'step', name: 'Square', description: 'Right-angle orthogonal path' },
  { id: 'smoothstep', name: 'Rounded', description: 'Orthogonal with rounded corners' },
  { id: 'straight', name: 'Straight', description: 'Straight with edge spreading' },
  { id: 'direct', name: 'Direct', description: 'Absolute straight line, no spreading' }
];

export interface Media {
  id: string;
  nodeId?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  url: string;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TAG TYPES
// ============================================================================

/**
 * Tag with metadata for organization and filtering
 */
export interface Tag {
  /** Unique tag name (normalized to lowercase) */
  name: string;
  /** Display color for tag chips */
  color: string;
  /** Number of nodes using this tag */
  count: number;
  /** When the tag was first created */
  createdAt: string;
  /** Last time a node was tagged with this */
  lastUsed: string;
}

/**
 * Tag filtering configuration
 */
export interface TagFilter {
  /** Tags to filter by */
  tags: string[];
  /** Match all tags (AND) or any tag (OR) */
  mode: 'AND' | 'OR';
}

/**
 * Association between a node and a tag
 */
export interface NodeTag {
  nodeId: string;
  tagName: string;
  addedAt: string;
}

/**
 * Tag autocomplete suggestion
 */
export interface TagSuggestion {
  tagName: string;
  frequency: number;
  matchScore: number;
}

/**
 * Tag statistics for analytics
 */
export interface TagStats {
  totalTags: number;
  totalTaggedNodes: number;
  averageTagsPerNode: number;
  mostUsedTags: Array<{ name: string; count: number }>;
  unusedTags: string[];
}

// ============================================================================
// SHARING TYPES
// ============================================================================

/**
 * Visibility options for concept maps
 */
export type MapVisibility = 'private' | 'public' | 'unlisted';

/**
 * Share settings for a concept map
 */
export interface ShareSettings {
  visibility: MapVisibility;
  shareSlug?: string;
  shareToken?: string;
  shareUrl?: string;
  sharedAt?: string;
}

/**
 * Input for enabling sharing on a concept map
 */
export interface EnableSharingInput {
  visibility: 'public' | 'unlisted';
  regenerateSlug?: boolean;
}

/**
 * Complete concept map export data
 */
export interface ConceptMapExport {
  version: string;
  exportedAt: string;
  map: {
    id: string;
    name: string;
    description?: string;
    viewport: Viewport;
    createdAt: string;
    updatedAt: string;
  };
  nodes: ConceptMapNode[];
  edges: ConceptMapEdge[];
  media: Media[];
}
