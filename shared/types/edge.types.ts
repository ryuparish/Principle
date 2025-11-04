export interface EdgeStyle {
  color?: string;
  strokeWidth?: number;
  animated?: boolean;
  type?: 'smoothstep' | 'straight' | 'step';
}

export interface Edge {
  id: string;
  conceptMapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  style: EdgeStyle;
  createdAt: Date;
}

export interface EdgeCreateInput {
  conceptMapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  style?: EdgeStyle;
}
