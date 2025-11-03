export interface EdgeStyle {
  color?: string;
  strokeWidth?: number;
  animated?: boolean;
  type?: 'smoothstep' | 'straight' | 'step';
}

export interface Edge {
  id: string;
  mindmapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  style: EdgeStyle;
  createdAt: Date;
}

export interface EdgeCreateInput {
  mindmapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  style?: EdgeStyle;
}
