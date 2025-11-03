import { Node } from 'reactflow';
import { MindmapEdge } from '../types';

/**
 * Navigation engine for graph traversal
 * Handles spatial and relationship-based navigation
 */

/**
 * Calculate minimum distance between two rectangles
 * Returns 0 if rectangles overlap
 */
const getMinRectDistance = (
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): number => {
  // Calculate the horizontal distance between rectangles
  let dx = 0;
  if (rect1.x + rect1.width < rect2.x) {
    // rect1 is to the left of rect2
    dx = rect2.x - (rect1.x + rect1.width);
  } else if (rect2.x + rect2.width < rect1.x) {
    // rect1 is to the right of rect2
    dx = rect1.x - (rect2.x + rect2.width);
  }
  // else rectangles overlap horizontally, dx = 0

  // Calculate the vertical distance between rectangles
  let dy = 0;
  if (rect1.y + rect1.height < rect2.y) {
    // rect1 is above rect2
    dy = rect2.y - (rect1.y + rect1.height);
  } else if (rect2.y + rect2.height < rect1.y) {
    // rect1 is below rect2
    dy = rect1.y - (rect2.y + rect2.height);
  }
  // else rectangles overlap vertically, dy = 0

  // Return Euclidean distance between closest points
  return Math.sqrt(dx * dx + dy * dy);
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

  let candidates: { id: string; distance: number }[] = [];

  nodes.forEach(node => {
    if (node.id === currentNodeId) return;

    const nodeRect = {
      x: node.position.x,
      y: node.position.y,
      width: node.width || 150,
      height: node.height || 60
    };

    // Check if node is strictly in the specified direction
    // We check based on the rectangles' positions
    let isInDirection = false;
    switch (direction) {
      case 'right':
        // Node is to the right if its left edge is past current's right edge
        isInDirection = nodeRect.x > currentRect.x + currentRect.width;
        break;
      case 'left':
        // Node is to the left if its right edge is before current's left edge
        isInDirection = nodeRect.x + nodeRect.width < currentRect.x;
        break;
      case 'down':
        // Node is below if its top edge is past current's bottom edge
        isInDirection = nodeRect.y > currentRect.y + currentRect.height;
        break;
      case 'up':
        // Node is above if its bottom edge is before current's top edge
        isInDirection = nodeRect.y + nodeRect.height < currentRect.y;
        break;
    }

    if (isInDirection) {
      // Calculate minimum distance between the two rectangles
      const distance = getMinRectDistance(currentRect, nodeRect);
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
  edges: MindmapEdge[],
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
  edges: MindmapEdge[],
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

// Find parent nodes (nodes with edges pointing to current)
export const findParentNodes = (
  currentNodeId: string,
  edges: MindmapEdge[]
): string[] => {
  return findConnectedNodes(currentNodeId, edges, 'incoming');
};

// Find child nodes (nodes current points to)
export const findChildNodes = (
  currentNodeId: string,
  edges: MindmapEdge[]
): string[] => {
  return findConnectedNodes(currentNodeId, edges, 'outgoing');
};

// Find all nodes in a subtree (current + all descendants)
export const findSubtreeNodes = (
  rootNodeId: string,
  edges: MindmapEdge[],
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
