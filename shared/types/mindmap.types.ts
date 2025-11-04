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
  createdAt: Date;
  updatedAt: Date;
}

export interface ConceptMapCreateInput {
  name: string;
  description?: string;
}

export interface ConceptMapUpdateInput {
  name?: string;
  description?: string;
  viewport?: Viewport;
}
