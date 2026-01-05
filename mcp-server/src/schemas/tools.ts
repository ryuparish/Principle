import { z } from 'zod';

// ============================================
// Shared Schemas
// ============================================

export const positionSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const viewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number().min(0.1).max(5)
});

// ============================================
// Concept Map Schemas
// ============================================

export const createMapSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().max(1000).optional()
});

export const updateMapSchema = z.object({
  mapId: z.string().uuid('Invalid map ID'),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  viewport: viewportSchema.optional()
});

export const deleteMapSchema = z.object({
  mapId: z.string().uuid('Invalid map ID')
});

export const getMapSchema = z.object({
  mapId: z.string().uuid('Invalid map ID')
});

// ============================================
// Node Schemas
// ============================================

export const shapeEnum = z.enum([
  'rounded-rectangle',
  'rectangle',
  'circle',
  'diamond',
  'hexagon',
  'parallelogram',
  'cylinder',
  'cloud',
  'actor',
  'document',
  'queue',
  'storage',
  'portal'
]);

export const createNodeSchema = z.object({
  mapId: z.string().uuid('Invalid map ID'),
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  description: z.string().optional(),
  position: positionSchema.optional(),
  shape: shapeEnum.optional(),
  tags: z.array(z.string()).optional()
});

// Edge definition for batch creation (references nodes by index)
export const batchEdgeSchema = z.object({
  sourceIndex: z.number().int().min(0),  // Index in nodes array
  targetIndex: z.number().int().min(0),  // Index in nodes array
  label: z.string().max(100).optional(),
  style: z.object({
    stroke: z.string().optional(),
    strokeWidth: z.number().min(1).max(10).optional(),
    animated: z.boolean().optional(),
    type: z.enum(['default', 'straight', 'step', 'smoothstep', 'bezier']).optional(),
    edgeType: z.string().optional()  // Relationship type like 'causes', 'supports', etc.
  }).optional()
});

// Edge crossing optimization options
export const crossingOptionsSchema = z.object({
  initialTemperature: z.number().min(1).max(1000).optional(),   // Starting temp (default: 100)
  coolingRate: z.number().min(0.9).max(0.9999).optional(),      // Cooling multiplier (default: 0.995)
  minTemperature: z.number().min(0.001).max(10).optional(),     // Stop threshold (default: 0.1)
  maxIterations: z.number().min(100).max(50000).optional(),     // Max iterations (default: 5000)
  moveRadius: z.number().min(10).max(200).optional()            // Max move distance (default: 50)
});

// Layout options for auto-layout
export const layoutOptionsSchema = z.object({
  width: z.number().min(500).max(20000).optional(),
  height: z.number().min(500).max(20000).optional(),
  padding: z.number().min(0).max(1000).optional(),
  repulsionStrength: z.number().min(-10000).max(0).optional(),  // Allow stronger repulsion
  linkDistance: z.number().min(50).max(1000).optional(),        // Allow longer links
  linkStrength: z.number().min(0).max(2).optional(),
  collisionRadius: z.number().min(20).max(500).optional(),      // Allow larger collision zones
  centerStrength: z.number().min(0).max(1).optional(),
  iterations: z.number().min(50).max(2000).optional(),
  pinnedNodeIds: z.array(z.string().uuid()).optional(),
  // Edge crossing minimization (simulated annealing post-processing)
  minimizeCrossings: z.boolean().optional(),                    // Enable SA optimization (default: false)
  crossingOptions: crossingOptionsSchema.optional()             // SA tuning parameters
});

export const batchCreateNodesSchema = z.object({
  mapId: z.string().uuid('Invalid map ID'),
  nodes: z.array(z.object({
    title: z.string().min(1).max(500),
    description: z.string().optional(),
    position: positionSchema.optional(),
    shape: shapeEnum.optional(),
    tags: z.array(z.string()).optional()
  })).min(1, 'At least one node required').max(50, 'Maximum 50 nodes per batch'),
  // NEW: Optional edges for auto-layout (references nodes by array index)
  edges: z.array(batchEdgeSchema).max(200).optional(),
  // NEW: Force auto-layout even without edges
  autoLayout: z.boolean().optional(),
  // NEW: Layout configuration options
  layoutOptions: layoutOptionsSchema.optional()
});

export const updateNodeSchema = z.object({
  nodeId: z.string().uuid('Invalid node ID'),
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  position: positionSchema.optional(),
  shape: shapeEnum.optional(),
  tags: z.array(z.string()).optional()
});

export const batchUpdateNodesSchema = z.object({
  updates: z.array(z.object({
    nodeId: z.string().uuid('Invalid node ID'),
    title: z.string().min(1).max(500).optional(),
    description: z.string().optional(),
    position: positionSchema.optional(),
    shape: shapeEnum.optional(),
    tags: z.array(z.string()).optional()
  })).min(1, 'At least one update required').max(50, 'Maximum 50 updates per batch')
});

export const deleteNodeSchema = z.object({
  nodeId: z.string().uuid('Invalid node ID')
});

export const searchNodesSchema = z.object({
  mapId: z.string().uuid('Invalid map ID'),
  query: z.string().min(1, 'Query is required').max(200, 'Query too long')
});

// ============================================
// Edge Schemas
// ============================================

export const edgeTypeEnum = z.enum(['default', 'straight', 'step', 'smoothstep', 'bezier']);

export const edgeStyleSchema = z.object({
  stroke: z.string().optional(),           // Color, e.g., '#ff0000'
  strokeWidth: z.number().min(1).max(10).optional(),
  animated: z.boolean().optional(),         // Animated dashed line
  type: edgeTypeEnum.optional()             // Edge path type
}).optional();

export const createEdgeSchema = z.object({
  mapId: z.string().uuid('Invalid map ID'),
  sourceNodeId: z.string().uuid('Invalid source node ID'),
  targetNodeId: z.string().uuid('Invalid target node ID'),
  label: z.string().max(100).optional(),    // Text label on the edge
  style: edgeStyleSchema
});

export const batchCreateEdgesSchema = z.object({
  mapId: z.string().uuid('Invalid map ID'),
  edges: z.array(z.object({
    sourceNodeId: z.string().uuid('Invalid source node ID'),
    targetNodeId: z.string().uuid('Invalid target node ID'),
    label: z.string().max(100).optional(),
    style: edgeStyleSchema
  })).min(1, 'At least one edge required').max(100, 'Maximum 100 edges per batch')
});

export const updateEdgeSchema = z.object({
  edgeId: z.string().uuid('Invalid edge ID'),
  label: z.string().max(100).optional(),
  style: edgeStyleSchema
});

export const deleteEdgeSchema = z.object({
  edgeId: z.string().uuid('Invalid edge ID')
});

export const getEdgesSchema = z.object({
  mapId: z.string().uuid('Invalid map ID')
});

// ============================================
// Layout Schemas
// ============================================

export const autoLayoutSchema = z.object({
  mapId: z.string().uuid('Invalid map ID'),
  options: layoutOptionsSchema.optional()
});

// ============================================
// Type Exports
// ============================================

export type CreateMapInput = z.infer<typeof createMapSchema>;
export type UpdateMapInput = z.infer<typeof updateMapSchema>;
export type DeleteMapInput = z.infer<typeof deleteMapSchema>;
export type GetMapInput = z.infer<typeof getMapSchema>;

export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type BatchCreateNodesInput = z.infer<typeof batchCreateNodesSchema>;
export type UpdateNodeInput = z.infer<typeof updateNodeSchema>;
export type BatchUpdateNodesInput = z.infer<typeof batchUpdateNodesSchema>;
export type DeleteNodeInput = z.infer<typeof deleteNodeSchema>;
export type SearchNodesInput = z.infer<typeof searchNodesSchema>;

export type CreateEdgeInput = z.infer<typeof createEdgeSchema>;
export type BatchCreateEdgesInput = z.infer<typeof batchCreateEdgesSchema>;
export type UpdateEdgeInput = z.infer<typeof updateEdgeSchema>;
export type DeleteEdgeInput = z.infer<typeof deleteEdgeSchema>;
export type GetEdgesInput = z.infer<typeof getEdgesSchema>;

export type LayoutOptionsInput = z.infer<typeof layoutOptionsSchema>;
export type CrossingOptionsInput = z.infer<typeof crossingOptionsSchema>;
export type AutoLayoutInput = z.infer<typeof autoLayoutSchema>;
export type BatchEdgeInput = z.infer<typeof batchEdgeSchema>;

// ============================================
// Media Schemas
// ============================================

export const uploadImageSchema = z.object({
  nodeId: z.string().uuid('Invalid node ID'),
  base64Data: z.string().optional(),
  filePath: z.string().optional(),
  url: z.string().url().optional(),
  originalName: z.string().optional()
}).refine(
  data => data.base64Data || data.filePath || data.url,
  { message: 'Either base64Data, filePath, or url is required' }
).refine(
  data => !data.base64Data || data.originalName,
  { message: 'originalName is required when using base64Data' }
);

export const fetchImageFromUrlSchema = z.object({
  nodeId: z.string().uuid('Invalid node ID'),
  url: z.string().url('Invalid URL format'),
  originalName: z.string().max(255).optional()
});

export const getNodeImagesSchema = z.object({
  nodeId: z.string().uuid('Invalid node ID')
});

export const deleteImageSchema = z.object({
  imageId: z.string().uuid('Invalid image ID')
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;
export type FetchImageFromUrlInput = z.infer<typeof fetchImageFromUrlSchema>;
export type GetNodeImagesInput = z.infer<typeof getNodeImagesSchema>;
export type DeleteImageInput = z.infer<typeof deleteImageSchema>;

// ============================================
// Walk Schemas
// ============================================

export const createWalkSchema = z.object({
  mapId: z.string().uuid('Invalid map ID'),
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().max(1000).optional()
});

export const updateWalkSchema = z.object({
  walkId: z.string().uuid('Invalid walk ID'),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional()
});

export const deleteWalkSchema = z.object({
  walkId: z.string().uuid('Invalid walk ID')
});

export const getWalkSchema = z.object({
  walkId: z.string().uuid('Invalid walk ID')
});

export const listWalksSchema = z.object({
  mapId: z.string().uuid('Invalid map ID')
});

export const addStepSchema = z.object({
  walkId: z.string().uuid('Invalid walk ID'),
  nodeId: z.string().uuid('Invalid node ID'),
  order: z.number().int().min(0).optional(),
  annotation: z.string().max(5000).optional(),
  zoomLevel: z.number().min(0.1).max(5).optional(),
  duration: z.number().int().min(0).optional()
});

export const updateStepSchema = z.object({
  stepId: z.string().uuid('Invalid step ID'),
  annotation: z.string().max(5000).optional(),
  zoomLevel: z.number().min(0.1).max(5).optional(),
  duration: z.number().int().min(0).optional(),
  order: z.number().int().min(0).optional()
});

export const removeStepSchema = z.object({
  stepId: z.string().uuid('Invalid step ID')
});

export const reorderStepsSchema = z.object({
  walkId: z.string().uuid('Invalid walk ID'),
  stepIds: z.array(z.string().uuid('Invalid step ID')).min(1, 'At least one step required')
});

export type CreateWalkInput = z.infer<typeof createWalkSchema>;
export type UpdateWalkInput = z.infer<typeof updateWalkSchema>;
export type DeleteWalkInput = z.infer<typeof deleteWalkSchema>;
export type GetWalkInput = z.infer<typeof getWalkSchema>;
export type ListWalksInput = z.infer<typeof listWalksSchema>;
export type AddStepInput = z.infer<typeof addStepSchema>;
export type UpdateStepInput = z.infer<typeof updateStepSchema>;
export type RemoveStepInput = z.infer<typeof removeStepSchema>;
export type ReorderStepsInput = z.infer<typeof reorderStepsSchema>;
