import { Node } from 'reactflow';
import { ConceptMapEdge } from '../types';

/**
 * Navigation engine for graph traversal
 * Handles spatial and relationship-based navigation
 */

/**
 * Calculate Euclidean distance between two points
 */
const euclideanDistance = (
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Find the closest point on a rectangle's perimeter to a given point
 */
const closestPointOnRect = (
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number }
): { x: number; y: number } => {
  // Clamp the point coordinates to the rectangle bounds
  const closestX = Math.max(rect.x, Math.min(point.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(point.y, rect.y + rect.height));

  return { x: closestX, y: closestY };
};

/**
 * Calculate angle from point1 to point2 in radians
 * Returns angle in range [-π, π] where:
 * - 0 = right (east)
 * - π/2 = down (south)
 * - ±π = left (west)
 * - -π/2 = up (north)
 */
const getAngleBetweenPoints = (
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.atan2(dy, dx);
};

/**
 * Check if an angle falls within a directional sector
 * Each sector is 180° wide (±90° from cardinal direction)
 * This creates full hemisphere coverage in each direction
 */
const isInAngularSector = (
  angle: number,
  direction: 'left' | 'right' | 'up' | 'down'
): boolean => {
  const PI = Math.PI;
  const HALF_PI = PI / 2; // 90 degrees

  switch (direction) {
    case 'right':
      // Accept angles from -90° to +90° (east-facing hemisphere)
      return angle >= -HALF_PI && angle <= HALF_PI;

    case 'down':
      // Accept angles from 0° to +180° (south-facing hemisphere)
      return angle >= 0 && angle <= PI;

    case 'left':
      // Accept angles from +90° to -90° (west-facing hemisphere)
      // This wraps around ±π, so we check if angle is in either range
      return angle >= HALF_PI || angle <= -HALF_PI;

    case 'up':
      // Accept angles from -180° to 0° (north-facing hemisphere)
      return angle >= -PI && angle <= 0;

    default:
      return false;
  }
};

// Find node in a specific spatial direction
export const findNodeInDirection = (
  currentNodeId: string,
  direction: 'left' | 'right' | 'up' | 'down',
  nodes: Node[]
): string | null => {
  const currentNode = nodes.find(n => n.id === currentNodeId);
  if (!currentNode) return null;

  const currentRect = {
    x: currentNode.position.x,
    y: currentNode.position.y,
    width: currentNode.width || 150,
    height: currentNode.height || 60
  };

  // Determine the starting point on the current node based on direction
  let startPoint: { x: number; y: number };
  switch (direction) {
    case 'left':
      // Start from leftmost center
      startPoint = {
        x: currentRect.x,
        y: currentRect.y + currentRect.height / 2
      };
      break;
    case 'right':
      // Start from rightmost center
      startPoint = {
        x: currentRect.x + currentRect.width,
        y: currentRect.y + currentRect.height / 2
      };
      break;
    case 'up':
      // Start from topmost center
      startPoint = {
        x: currentRect.x + currentRect.width / 2,
        y: currentRect.y
      };
      break;
    case 'down':
      // Start from bottommost center
      startPoint = {
        x: currentRect.x + currentRect.width / 2,
        y: currentRect.y + currentRect.height
      };
      break;
  }

  // Calculate the center of the current node for angular calculations
  const currentCenter = {
    x: currentRect.x + currentRect.width / 2,
    y: currentRect.y + currentRect.height / 2
  };

  let candidates: { id: string; distance: number }[] = [];

  nodes.forEach(node => {
    if (node.id === currentNodeId) return;

    const nodeRect = {
      x: node.position.x,
      y: node.position.y,
      width: node.width || 150,
      height: node.height || 60
    };

    // Calculate the center of the candidate node
    const nodeCenter = {
      x: nodeRect.x + nodeRect.width / 2,
      y: nodeRect.y + nodeRect.height / 2
    };

    // Calculate angle from current node center to candidate node center
    const angle = getAngleBetweenPoints(currentCenter, nodeCenter);

    // Check if the candidate is in the correct angular sector for this direction
    const isInDirection = isInAngularSector(angle, direction);

    if (isInDirection) {
      // Find the closest point on the candidate node's rectangle to our start point
      const closestPoint = closestPointOnRect(startPoint, nodeRect);

      // Calculate Euclidean distance from start point to closest point on candidate
      const distance = euclideanDistance(startPoint, closestPoint);
      candidates.push({ id: node.id, distance });
    }
  });

  if (candidates.length === 0) return null;

  // Sort by distance and return closest
  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0].id;
};

// Find connected nodes (following edges)
export const findConnectedNodes = (
  currentNodeId: string,
  edges: ConceptMapEdge[],
  direction: 'outgoing' | 'incoming' | 'both'
): string[] => {
  const connected: string[] = [];

  edges.forEach(edge => {
    if (direction === 'outgoing' || direction === 'both') {
      if (edge.sourceNodeId === currentNodeId) {
        connected.push(edge.targetNodeId);
      }
    }
    if (direction === 'incoming' || direction === 'both') {
      if (edge.targetNodeId === currentNodeId) {
        connected.push(edge.sourceNodeId);
      }
    }
  });

  return [...new Set(connected)]; // Remove duplicates
};

// Find next/previous connected node (for Tab navigation)
export const findNextConnectedNode = (
  currentNodeId: string,
  edges: ConceptMapEdge[],
  reverse: boolean = false
): string | null => {
  const connected = findConnectedNodes(currentNodeId, edges, 'both');
  if (connected.length === 0) return null;

  // Sort for consistent ordering
  connected.sort();

  if (reverse) {
    return connected[connected.length - 1];
  }
  return connected[0];
};

// Find first node (topmost, then leftmost)
export const findFirstNode = (nodes: Node[]): string | null => {
  if (nodes.length === 0) return null;

  let first = nodes[0];
  nodes.forEach(node => {
    if (node.position.y < first.position.y ||
        (node.position.y === first.position.y && node.position.x < first.position.x)) {
      first = node;
    }
  });

  return first.id;
};

// Find last node (bottommost, then rightmost)
export const findLastNode = (nodes: Node[]): string | null => {
  if (nodes.length === 0) return null;

  let last = nodes[0];
  nodes.forEach(node => {
    if (node.position.y > last.position.y ||
        (node.position.y === last.position.y && node.position.x > last.position.x)) {
      last = node;
    }
  });

  return last.id;
};

/**
 * Find the nearest node to a given position
 * @param position - The reference position {x, y}
 * @param nodes - Available nodes to search
 * @returns The closest node ID, or null if no nodes available
 */
export const findNearestNode = (
  position: { x: number; y: number },
  nodes: ConceptMapNode[]
): string | null => {
  if (nodes.length === 0) return null;

  let nearestNode: ConceptMapNode | null = null;
  let minDistance = Infinity;

  for (const node of nodes) {
    const distance = euclideanDistance(position, node.position);
    if (distance < minDistance) {
      minDistance = distance;
      nearestNode = node;
    }
  }

  return nearestNode?.id || null;
};

// Find parent nodes (nodes with edges pointing to current)
export const findParentNodes = (
  currentNodeId: string,
  edges: ConceptMapEdge[]
): string[] => {
  return findConnectedNodes(currentNodeId, edges, 'incoming');
};

// Find child nodes (nodes current points to)
export const findChildNodes = (
  currentNodeId: string,
  edges: ConceptMapEdge[]
): string[] => {
  return findConnectedNodes(currentNodeId, edges, 'outgoing');
};

// Find all nodes in a subtree (current + all descendants)
export const findSubtreeNodes = (
  rootNodeId: string,
  edges: ConceptMapEdge[],
  maxDepth: number = 100
): string[] => {
  const visited = new Set<string>();
  const queue: { id: string; depth: number }[] = [{ id: rootNodeId, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id) || current.depth >= maxDepth) continue;

    visited.add(current.id);

    const children = findChildNodes(current.id, edges);
    children.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push({ id: childId, depth: current.depth + 1 });
      }
    });
  }

  return Array.from(visited);
};

// Find node by title (for search)
export const findNodesByTitle = (
  query: string,
  nodes: Node[],
  caseSensitive: boolean = false
): string[] => {
  const searchQuery = caseSensitive ? query : query.toLowerCase();

  return nodes
    .filter(node => {
      const title = node.data?.label || '';
      const searchTitle = caseSensitive ? title : title.toLowerCase();
      return searchTitle.includes(searchQuery);
    })
    .map(node => node.id);
};

// Find node by title prefix (for f{char} command)
export const findNodesByPrefix = (
  prefix: string,
  nodes: Node[],
  currentNodeId: string | null = null
): string[] => {
  const lowerPrefix = prefix.toLowerCase();

  const matches = nodes
    .filter(node => {
      const title = (node.data?.label || '').toLowerCase();
      return title.startsWith(lowerPrefix) && node.id !== currentNodeId;
    })
    .map(node => node.id);

  return matches;
};

// Get node position for viewport centering
export const getNodeCenter = (nodeId: string, nodes: Node[]): { x: number; y: number } | null => {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return null;

  const width = node.width || 150;
  const height = node.height || 60;

  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2
  };
};
