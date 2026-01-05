import ELK, { ElkNode } from 'elkjs';

const elk = new ELK();

export interface LayoutOptions {
  algorithm?: 'layered' | 'stress' | 'force' | 'mrtree';
  direction?: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';
  nodeSpacing?: number;
  layerSpacing?: number;
}

export interface NodeInput {
  id: string;
  width?: number;
  height?: number;
}

export interface EdgeInput {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
}

/**
 * Calculate layout positions for nodes using ELKjs
 * Uses the layered algorithm with built-in edge crossing minimization
 */
export async function calculateLayout(
  nodes: NodeInput[],
  edges: EdgeInput[],
  options: LayoutOptions = {}
): Promise<Map<string, { x: number; y: number }>> {
  if (nodes.length === 0) {
    return new Map();
  }

  // Build ELK graph structure
  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': options.algorithm || 'layered',
      'elk.direction': options.direction || 'DOWN',
      'elk.spacing.nodeNode': String(options.nodeSpacing || 100),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(options.layerSpacing || 150),
      // Enable crossing minimization
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.crossingMinimization.greedySwitch.type': 'TWO_SIDED',
      // Edge routing - route edges around nodes with right-angle bends
      'elk.edgeRouting': 'ORTHOGONAL',
      // Spacing - prevent edge-node overlap
      'elk.spacing.edgeNode': '80',
      'elk.layered.spacing.edgeNodeBetweenLayers': '60',
      'elk.spacing.edgeEdge': '30',
      // Node placement strategy
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX'
    },
    children: nodes.map(n => ({
      id: n.id,
      width: n.width || 180,
      height: n.height || 100
    })),
    edges: edges.map(e => ({
      id: e.id,
      sources: [e.sourceNodeId],
      targets: [e.targetNodeId]
    }))
  };

  // Run ELK layout
  const result = await elk.layout(graph);

  // Extract positions
  const positions = new Map<string, { x: number; y: number }>();
  for (const child of result.children || []) {
    if (child.x !== undefined && child.y !== undefined) {
      positions.set(child.id, {
        x: Math.round(child.x),
        y: Math.round(child.y)
      });
    }
  }

  return positions;
}

export const layoutService = {
  calculateLayout
};
