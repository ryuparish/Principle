export interface Position {
  x: number;
  y: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Mindmap {
  id: string;
  name: string;
  description?: string;
  viewport: Viewport;
  createdAt: string;
  updatedAt: string;
  nodes?: MindmapNode[];
}

export interface MindmapNode {
  id: string;
  mindmapId: string;
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

export interface CreateMindmapInput {
  name: string;
  description?: string;
}

export interface CreateNodeInput {
  mindmapId: string;
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

export interface MindmapEdge {
  id: string;
  mindmapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  style: EdgeStyle;
  createdAt: string;
}

export interface CreateEdgeInput {
  mindmapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  style?: EdgeStyle;
}

export interface UpdateEdgeInput {
  label?: string;
  style?: EdgeStyle;
}
