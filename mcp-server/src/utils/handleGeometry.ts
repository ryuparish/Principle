/**
 * Handle geometry utilities for calculating optimal edge handles
 * Based on node positions and shapes
 */

// Default node dimensions (matches client-side defaults)
const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 74;

// Valid handle IDs
export type HandleId = 'top' | 'right' | 'bottom' | 'left';

interface NodePosition {
  x: number;
  y: number;
}

interface HandlePosition {
  handleId: HandleId;
  x: number;
  y: number;
}

/**
 * Calculate handle positions for a node based on its position and shape
 * Uses default dimensions since we don't have DOM access in the server
 */
function getHandlePositions(
  position: NodePosition,
  shape: string = 'rounded-rectangle',
  width: number = DEFAULT_NODE_WIDTH,
  height: number = DEFAULT_NODE_HEIGHT
): HandlePosition[] {
  const positions: HandlePosition[] = [];

  // All shapes have all four handles (top, right, bottom, left)
  // Some shapes have offset handles, but for simplicity we use centered handles

  // Top handle (center of top edge)
  positions.push({
    handleId: 'top',
    x: position.x + width / 2,
    y: position.y
  });

  // Right handle (center of right edge)
  positions.push({
    handleId: 'right',
    x: position.x + width,
    y: position.y + height / 2
  });

  // Bottom handle (center of bottom edge)
  positions.push({
    handleId: 'bottom',
    x: position.x + width / 2,
    y: position.y + height
  });

  // Left handle (center of left edge)
  positions.push({
    handleId: 'left',
    x: position.x,
    y: position.y + height / 2
  });

  return positions;
}

/**
 * Calculate the Euclidean distance between two points
 */
function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

/**
 * Calculate the closest handle pair between two nodes based on their positions
 * This finds the optimal source and target handles that minimize edge length
 */
export function getClosestHandles(
  sourcePosition: NodePosition,
  targetPosition: NodePosition,
  sourceShape?: string,
  targetShape?: string
): { sourceHandle: HandleId; targetHandle: HandleId } {
  const sourceHandles = getHandlePositions(sourcePosition, sourceShape);
  const targetHandles = getHandlePositions(targetPosition, targetShape);

  let minDistance = Infinity;
  let closestPair = { sourceHandle: 'right' as HandleId, targetHandle: 'left' as HandleId };

  // Find the pair with minimum distance
  for (const sh of sourceHandles) {
    for (const th of targetHandles) {
      const dist = distance(sh.x, sh.y, th.x, th.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestPair = { sourceHandle: sh.handleId, targetHandle: th.handleId };
      }
    }
  }

  return closestPair;
}

/**
 * Calculate optimal handles for multiple edges efficiently
 * Takes a map of node positions indexed by node ID
 */
export function calculateOptimalHandles(
  edges: Array<{ sourceNodeId: string; targetNodeId: string }>,
  nodePositions: Map<string, { position: NodePosition; shape?: string }>
): Map<string, { sourceHandle: HandleId; targetHandle: HandleId }> {
  const results = new Map<string, { sourceHandle: HandleId; targetHandle: HandleId }>();

  for (const edge of edges) {
    const sourceNode = nodePositions.get(edge.sourceNodeId);
    const targetNode = nodePositions.get(edge.targetNodeId);

    if (sourceNode && targetNode) {
      const handles = getClosestHandles(
        sourceNode.position,
        targetNode.position,
        sourceNode.shape,
        targetNode.shape
      );

      // Create a unique key for this edge
      const key = `${edge.sourceNodeId}->${edge.targetNodeId}`;
      results.set(key, handles);
    }
  }

  return results;
}
