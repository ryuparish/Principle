import { ConceptMapNode, ConceptMapEdge } from '../types';
import {
  findConnectedNodes,
  findSubtreeNodes
} from './navigationEngine';

/**
 * Operator engine for vim operations
 * Handles delete, yank, and other operations on graph objects
 */

// Get nodes and edges for a graph object
export const resolveGraphObject = (
  object: string,
  focusedNodeId: string | null,
  selectedNodeIds: Set<string>,
  allNodes: ConceptMapNode[],
  allEdges: ConceptMapEdge[]
): { nodes: ConceptMapNode[]; edges: ConceptMapEdge[] } => {
  const nodes: ConceptMapNode[] = [];
  const edges: ConceptMapEdge[] = [];

  switch (object) {
    case 'n': // Current node
      if (focusedNodeId) {
        const node = allNodes.find(n => n.id === focusedNodeId);
        if (node) {
          nodes.push(node);
          // Include edges connected to this node
          const connectedEdges = allEdges.filter(
            e => e.sourceNodeId === focusedNodeId || e.targetNodeId === focusedNodeId
          );
          edges.push(...connectedEdges);
        }
      }
      break;

    case 's': // Selected nodes
      selectedNodeIds.forEach(id => {
        const node = allNodes.find(n => n.id === id);
        if (node) nodes.push(node);
      });
      // Include edges between selected nodes
      const selectedIdArray = Array.from(selectedNodeIds);
      edges.push(...allEdges.filter(e =>
        selectedIdArray.includes(e.sourceNodeId) && selectedIdArray.includes(e.targetNodeId)
      ));
      break;

    case 'c': // Connected nodes
      if (focusedNodeId) {
        const connectedIds = findConnectedNodes(focusedNodeId, allEdges, 'both');
        connectedIds.forEach(id => {
          const node = allNodes.find(n => n.id === id);
          if (node) nodes.push(node);
        });
        // Include edges between connected nodes
        const connectedIdSet = new Set(connectedIds);
        edges.push(...allEdges.filter(e =>
          connectedIdSet.has(e.sourceNodeId) && connectedIdSet.has(e.targetNodeId)
        ));
      }
      break;

    case 't': // Tree (subtree starting from current node)
      if (focusedNodeId) {
        const subtreeIds = findSubtreeNodes(focusedNodeId, allEdges);
        subtreeIds.forEach(id => {
          const node = allNodes.find(n => n.id === id);
          if (node) nodes.push(node);
        });
        // Include edges within subtree
        const subtreeIdSet = new Set(subtreeIds);
        edges.push(...allEdges.filter(e =>
          subtreeIdSet.has(e.sourceNodeId) && subtreeIdSet.has(e.targetNodeId)
        ));
      }
      break;

    case 'a': // All nodes
      nodes.push(...allNodes);
      edges.push(...allEdges);
      break;

    default:
      break;
  }

  return { nodes, edges };
};

// Execute delete operation
export const executeDelete = async (
  nodes: ConceptMapNode[],
  edges: ConceptMapEdge[],
  deleteNodesFn: (ids: string[], skipHistory?: boolean) => Promise<void>,
  deleteEdgeWithoutHistoryFn: (id: string) => Promise<void>,
  saveHistoryFn: () => void
): Promise<void> => {
  // CRITICAL: Save history BEFORE deleting anything (captures nodes + edges)
  saveHistoryFn();

  // Delete edges first (without saving history for each edge)
  for (const edge of edges) {
    try {
      await deleteEdgeWithoutHistoryFn(edge.id);
    } catch (error) {
      console.error(`Failed to delete edge ${edge.id}:`, error);
    }
  }

  // Then delete nodes (skip history since we already saved it above)
  const nodeIds = nodes.map(n => n.id);
  if (nodeIds.length > 0) {
    try {
      await deleteNodesFn(nodeIds, true); // skipHistory = true
    } catch (error) {
      console.error('Failed to delete nodes:', error);
    }
  }
};

// Execute yank operation (copy to register)
export const executeYank = (
  nodes: ConceptMapNode[],
  edges: ConceptMapEdge[]
): { nodes: ConceptMapNode[]; edges: ConceptMapEdge[] } => {
  // Deep copy nodes and edges for yank register
  return {
    nodes: nodes.map(n => ({ ...n })),
    edges: edges.map(e => ({ ...e }))
  };
};

// Execute paste operation
export const executePaste = async (
  yankRegister: { nodes: ConceptMapNode[]; edges: ConceptMapEdge[] },
  focusedNodeId: string | null,
  pasteAsConnected: boolean,
  createNodeFn: (title: string, position: { x: number; y: number }) => Promise<ConceptMapNode>,
  createEdgeFn: (sourceNodeId: string, targetNodeId: string, label?: string) => Promise<ConceptMapEdge>
): Promise<string[]> => {
  const createdNodeIds: string[] = [];
  const oldToNewIdMap = new Map<string, string>();

  if (yankRegister.nodes.length === 0) {
    return createdNodeIds;
  }

  // Calculate offset for pasted nodes
  const offset = { x: 100, y: 100 };

  // If pasting as connected, offset from focused node
  // Otherwise, just offset from original positions

  // Create nodes
  for (const node of yankRegister.nodes) {
    try {
      const newPosition = {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y
      };

      const newNode = await createNodeFn(node.title, newPosition);
      oldToNewIdMap.set(node.id, newNode.id);
      createdNodeIds.push(newNode.id);

      // TODO: Copy content, style, tags, etc. in a future update
    } catch (error) {
      console.error(`Failed to paste node ${node.title}:`, error);
    }
  }

  // Create edges between pasted nodes
  for (const edge of yankRegister.edges) {
    const newSourceId = oldToNewIdMap.get(edge.sourceNodeId);
    const newTargetId = oldToNewIdMap.get(edge.targetNodeId);

    if (newSourceId && newTargetId) {
      try {
        await createEdgeFn(newSourceId, newTargetId, edge.label);
      } catch (error) {
        console.error('Failed to paste edge:', error);
      }
    }
  }

  // If pasting as connected (P), create edge from focused node to first pasted node
  if (pasteAsConnected && focusedNodeId && createdNodeIds.length > 0) {
    try {
      await createEdgeFn(focusedNodeId, createdNodeIds[0]);
    } catch (error) {
      console.error('Failed to create connecting edge:', error);
    }
  }

  return createdNodeIds;
};
