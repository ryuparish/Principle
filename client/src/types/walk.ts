// Walk feature types

export interface Walk {
  id: string;
  conceptMapId: string;
  name: string;
  description?: string | null;
  steps: WalkStep[];
  createdAt: string;
  updatedAt: string;
}

export interface WalkStep {
  id: string;
  walkId: string;
  nodeId: string;
  order: number;
  annotation?: string | null;
  zoomLevel: number;
  duration?: number | null;
  createdAt: string;
}

export interface CreateWalkInput {
  conceptMapId: string;
  name: string;
  description?: string;
}

export interface UpdateWalkInput {
  name?: string;
  description?: string;
}

export interface CreateStepInput {
  nodeId: string;
  order: number;
  annotation?: string;
  zoomLevel?: number;
  duration?: number;
}

export interface UpdateStepInput {
  annotation?: string;
  zoomLevel?: number;
  duration?: number;
  order?: number;
}
