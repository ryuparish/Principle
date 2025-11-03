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
  createdAt: Date;
  updatedAt: Date;
}

export interface MindmapCreateInput {
  name: string;
  description?: string;
}

export interface MindmapUpdateInput {
  name?: string;
  description?: string;
  viewport?: Viewport;
}
