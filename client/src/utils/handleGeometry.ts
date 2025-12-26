import { Node } from 'reactflow';
import { ConceptMapNode } from '../types';
import { SHAPE_CONFIGS } from '../types/shapes';

interface HandlePosition {
  handleId: string;
  x: number;
  y: number;
}

/**
 * Calculate the closest handle pair between two nodes based on their positions
 */
export function getClosestHandles(
  sourceNode: Node<{ node: ConceptMapNode }>,
  targetNode: Node<{ node: ConceptMapNode }>,
  getNode: (id: string) => Node | undefined
): { sourceHandle: string; targetHandle: string } | null {
  console.log('[HANDLE] getClosestHandles called for:', sourceNode.id, 'to', targetNode.id);

  const source = getNode(sourceNode.id);
  const target = getNode(targetNode.id);

  console.log('[HANDLE] Got nodes:', source?.id, target?.id);

  if (!source || !target) {
    console.log('[HANDLE] Source or target is null, returning null');
    return null;
  }

  // Get shape configs
  const sourceShape = (sourceNode.data.node.shape || 'rounded-rectangle') as keyof typeof SHAPE_CONFIGS;
  const targetShape = (targetNode.data.node.shape || 'rounded-rectangle') as keyof typeof SHAPE_CONFIGS;
  const sourceConfig = SHAPE_CONFIGS[sourceShape];
  const targetConfig = SHAPE_CONFIGS[targetShape];

  console.log('[HANDLE] Shapes:', sourceShape, targetShape);
  console.log('[HANDLE] Configs:', sourceConfig, targetConfig);

  if (!sourceConfig || !targetConfig) {
    console.log('[HANDLE] Config is null, returning null');
    return null;
  }

  // Calculate handle world positions
  const sourceHandles = getHandlePositions(source, sourceConfig);
  const targetHandles = getHandlePositions(target, targetConfig);

  if (sourceHandles.length === 0 || targetHandles.length === 0) {
    return { sourceHandle: 'right', targetHandle: 'left' }; // Default fallback
  }

  // Find closest pair using Euclidean distance
  let minDistance = Infinity;
  let closestPair = { sourceHandle: 'right', targetHandle: 'left' };

  sourceHandles.forEach(sh => {
    targetHandles.forEach(th => {
      const distance = Math.sqrt(
        Math.pow(sh.x - th.x, 2) + Math.pow(sh.y - th.y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestPair = { sourceHandle: sh.handleId, targetHandle: th.handleId };
      }
    });
  });

  console.log('[HANDLE] Closest pair:', closestPair, 'with distance:', minDistance);
  return closestPair;
}

/**
 * Calculate world coordinates for all handles of a node
 */
function getHandlePositions(
  node: Node,
  shapeConfig: any
): HandlePosition[] {
  const positions: HandlePosition[] = [];
  const offsets = shapeConfig.handleOffsets || {};

  // Try to get actual DOM dimensions if node.width/height are undefined
  let nodeWidth = node.width;
  let nodeHeight = node.height;

  if (!nodeWidth || !nodeHeight) {
    // Query the actual DOM element to get measured dimensions
    const domNode = document.querySelector(`.react-flow__node[data-id="${node.id}"]`);
    if (domNode) {
      const rect = domNode.getBoundingClientRect();
      nodeWidth = nodeWidth || rect.width;
      nodeHeight = nodeHeight || rect.height;
      console.log(`[HANDLE] Using DOM dimensions for ${node.id}:`, rect.width, 'x', rect.height);
    }
  }

  // More accurate fallback dimensions (accounts for padding: 12px 20px + min-width: 150px)
  nodeWidth = nodeWidth || 200;  // 150 + (20*2) padding + some margin
  nodeHeight = nodeHeight || 74; // 50 + (12*2) padding + some margin

  console.log(`[HANDLE] Final dimensions for ${node.id}:`, nodeWidth, 'x', nodeHeight);

  // Helper to parse offsets (handles percentages)
  const parseOffset = (offsetStr: string | undefined, baseValue: number): number => {
    if (!offsetStr) return 0;
    const str = offsetStr.toString();
    if (str.endsWith('%')) {
      return (parseFloat(str) / 100) * baseValue;
    }
    return parseFloat(str) || 0;
  };

  // Top handle
  if (shapeConfig.handles.top) {
    const offset = offsets.top || {};
    positions.push({
      handleId: 'top',
      x: node.position.x + nodeWidth / 2 + parseOffset(offset.x, nodeWidth),
      y: node.position.y + parseOffset(offset.y, nodeHeight)
    });
  }

  // Right handle
  if (shapeConfig.handles.right) {
    const offset = offsets.right || {};
    positions.push({
      handleId: 'right',
      x: node.position.x + nodeWidth + parseOffset(offset.x, nodeWidth),
      y: node.position.y + nodeHeight / 2 + parseOffset(offset.y, nodeHeight)
    });
  }

  // Bottom handle
  if (shapeConfig.handles.bottom) {
    const offset = offsets.bottom || {};
    positions.push({
      handleId: 'bottom',
      x: node.position.x + nodeWidth / 2 + parseOffset(offset.x, nodeWidth),
      y: node.position.y + nodeHeight + parseOffset(offset.y, nodeHeight)
    });
  }

  // Left handle
  if (shapeConfig.handles.left) {
    const offset = offsets.left || {};
    positions.push({
      handleId: 'left',
      x: node.position.x + parseOffset(offset.x, nodeWidth),
      y: node.position.y + nodeHeight / 2 + parseOffset(offset.y, nodeHeight)
    });
  }

  console.log(`[HANDLE] Calculated positions for ${node.id}:`, positions);
  return positions;
}
