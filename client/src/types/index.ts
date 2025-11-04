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
}

export interface UpdateNodeInput {
  title?: string;
  content?: any;
  position?: Position;
  style?: any;
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
  label?: string;
  style: EdgeStyle;
  createdAt: string;
}

export interface CreateEdgeInput {
  conceptMapId: string;
  sourceNodeId: string;
  targetNodeId: string;
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
