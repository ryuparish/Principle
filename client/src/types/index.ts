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
  type?: 'default' | 'straight' | 'step' | 'smoothstep';
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
