import { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { useConceptMapStore } from "../store/conceptMapStore";
import { useVimMode } from './useVimMode';
import { GraphObject } from '../types/vim.types';
import { queueApi } from '../api/queue.api';
import {
  resolveGraphObject,
  executeDelete,
  executeYank,
  executePaste
} from '../services/operatorEngine';

/**
 * Vim operations hook
 * Provides high-level operation functions (delete, yank, paste, etc.)
 */
export const useVimOperations = () => {
  const vim = useVimMode();
  const { getNodes, setNodes } = useReactFlow();
  const {
    nodes: storeNodes,
    edges: storeEdges,
    deleteNodes,
    deleteEdge,
    createNode,
    createEdge,
    updateNodeLocal
  } = useConceptMapStore();

  // Delete operation
  const deleteOperation = useCallback(async (object: GraphObject) => {
    const { nodes, edges } = resolveGraphObject(
      object,
      vim.state.focusedNodeId,
      vim.state.selectedNodeIds,
      storeNodes,
      storeEdges
    );

    if (nodes.length === 0) {
      return;
    }

    // Execute delete
    await executeDelete(nodes, edges, deleteNodes, deleteEdge);

    // Clear focus if focused node was deleted
    if (vim.state.focusedNodeId && nodes.some(n => n.id === vim.state.focusedNodeId)) {
      vim.setFocus(null);
    }

    // Clear selection
    vim.clearSelection();
  }, [vim, storeNodes, storeEdges, deleteNodes, deleteEdge]);

  // Yank operation
  const yankOperation = useCallback((object: GraphObject) => {
    const { nodes, edges } = resolveGraphObject(
      object,
      vim.state.focusedNodeId,
      vim.state.selectedNodeIds,
      storeNodes,
      storeEdges
    );

    if (nodes.length === 0) {
      return;
    }

    // Copy to yank register
    const yanked = executeYank(nodes, edges);
    vim.yankNodes(yanked.nodes, yanked.edges);
  }, [vim, storeNodes, storeEdges]);

  // Paste operation
  const pasteOperation = useCallback(async (pasteAsConnected: boolean = false) => {
    if (vim.state.yankRegister.nodes.length === 0) {
      return;
    }

    const createdNodeIds = await executePaste(
      vim.state.yankRegister,
      vim.state.focusedNodeId,
      pasteAsConnected,
      createNode,
      createEdge
    );

    // Focus first pasted node
    if (createdNodeIds.length > 0) {
      vim.setFocus(createdNodeIds[0]);
    }
  }, [vim, createNode, createEdge]);

  // Delete focused node (quick delete, like x)
  const deleteFocusedNode = useCallback(async () => {
    if (!vim.state.focusedNodeId) return;

    await deleteOperation('n');
  }, [vim.state.focusedNodeId, deleteOperation]);

  // Yank focused node
  const yankFocusedNode = useCallback(() => {
    if (!vim.state.focusedNodeId) return;

    yankOperation('n');
  }, [vim.state.focusedNodeId, yankOperation]);

  // Delete selected nodes
  const deleteSelection = useCallback(async () => {
    if (vim.state.selectedNodeIds.size === 0) return;

    await deleteOperation('s');
  }, [vim.state.selectedNodeIds, deleteOperation]);

  // Yank selected nodes
  const yankSelection = useCallback(() => {
    if (vim.state.selectedNodeIds.size === 0) return;

    yankOperation('s');
  }, [vim.state.selectedNodeIds, yankOperation]);

  // Change operation (delete + enter insert mode)
  const changeOperation = useCallback(async (object: GraphObject) => {
    await deleteOperation(object);
    vim.enterInsertMode();
  }, [deleteOperation, vim]);

  // Create edge (for edge mode)
  const createEdgeOperation = useCallback(async (sourceId: string, targetId: string) => {
    try {
      await createEdge(sourceId, targetId);
      console.log('[EDGE] Created edge from', sourceId, 'to', targetId);
    } catch (error) {
      console.error('[EDGE] Failed to create edge:', error);
    }
  }, [createEdge]);

  // Move focused node (for move mode)
  const moveFocusedNode = useCallback((dx: number, dy: number) => {
    if (!vim.state.focusedNodeId) return;

    const nodeId = vim.state.focusedNodeId;
    console.log('[MOVE] Moving node:', nodeId, 'by', dx, dy);

    // Track new position for persistence
    let newPosition: { x: number; y: number } | null = null;

    // Update ReactFlow nodes directly for immediate visual feedback
    setNodes((nodes) => {
      return nodes.map((node) => {
        if (node.id === nodeId) {
          newPosition = {
            x: node.position.x + dx,
            y: node.position.y + dy
          };
          console.log('[MOVE] Current position:', node.position, '-> New position:', newPosition);

          return {
            ...node,
            position: newPosition
          };
        }
        return node;
      });
    });

    // Persist to store and database (outside setNodes callback to avoid timing issues)
    if (newPosition) {
      // Update in-memory store immediately
      updateNodeLocal(nodeId, { position: newPosition });

      // Publish to queue for database persistence (fire-and-forget)
      queueApi.publish({
        nodeId,
        position: newPosition
      });
    }
  }, [vim.state.focusedNodeId, setNodes, updateNodeLocal]);

  // Move selected nodes (for move mode with visual selection)
  const moveSelectedNodes = useCallback((dx: number, dy: number) => {
    if (vim.state.selectedNodeIds.size === 0) return;

    const selectedIds = Array.from(vim.state.selectedNodeIds);
    console.log('[MOVE] Moving selected nodes:', selectedIds, 'by', dx, dy);

    // Track new positions for persistence
    const newPositions = new Map<string, { x: number; y: number }>();

    // Update ReactFlow nodes directly for immediate visual feedback
    setNodes((nodes) => {
      return nodes.map((node) => {
        if (selectedIds.includes(node.id)) {
          const newPosition = {
            x: node.position.x + dx,
            y: node.position.y + dy
          };
          newPositions.set(node.id, newPosition);

          return {
            ...node,
            position: newPosition
          };
        }
        return node;
      });
    });

    // Persist all moved nodes to store and database
    newPositions.forEach((position, nodeId) => {
      // Update in-memory store immediately
      updateNodeLocal(nodeId, { position });

      // Publish to queue for database persistence (fire-and-forget)
      queueApi.publish({
        nodeId,
        position
      });
    });
  }, [vim.state.selectedNodeIds, setNodes, updateNodeLocal]);

  // Get connected edge IDs for a node (for edge edit mode)
  const getConnectedEdgeIds = useCallback((nodeId: string): string[] => {
    return storeEdges
      .filter(edge => edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId)
      .map(edge => edge.id);
  }, [storeEdges]);

  // Delete selected edge (for edge edit mode)
  const deleteSelectedEdge = useCallback(async () => {
    const { edgeIds, selectedIndex } = vim.state.edgeEditMode;
    if (selectedIndex < 0 || selectedIndex >= edgeIds.length) return;

    const edgeId = edgeIds[selectedIndex];
    console.log('[EDGE EDIT] Deleting edge:', edgeId);

    try {
      await deleteEdge(edgeId);

      // Update edge edit mode state with remaining edges
      const remainingEdges = edgeIds.filter((id, idx) => idx !== selectedIndex);
      if (remainingEdges.length > 0) {
        // Adjust selected index if needed
        const newIndex = Math.min(selectedIndex, remainingEdges.length - 1);
        vim.startEdgeEditMode(vim.state.edgeEditMode.nodeId!, remainingEdges);
        // Manually update selected index
        for (let i = 0; i < newIndex; i++) {
          vim.selectNextEdge();
        }
      } else {
        // No more edges, exit edge edit mode
        vim.exitEdgeEditMode();
      }
    } catch (error) {
      console.error('[EDGE EDIT] Failed to delete edge:', error);
    }
  }, [vim, deleteEdge]);

  // Get source node ID of selected edge
  const getSelectedEdgeSourceId = useCallback((): string | null => {
    const { edgeIds, selectedIndex } = vim.state.edgeEditMode;
    if (selectedIndex < 0 || selectedIndex >= edgeIds.length) return null;

    const edgeId = edgeIds[selectedIndex];
    const edge = storeEdges.find(e => e.id === edgeId);
    return edge?.sourceNodeId || null;
  }, [vim.state.edgeEditMode, storeEdges]);

  // Get target node ID of selected edge
  const getSelectedEdgeTargetId = useCallback((): string | null => {
    const { edgeIds, selectedIndex } = vim.state.edgeEditMode;
    if (selectedIndex < 0 || selectedIndex >= edgeIds.length) return null;

    const edgeId = edgeIds[selectedIndex];
    const edge = storeEdges.find(e => e.id === edgeId);
    return edge?.targetNodeId || null;
  }, [vim.state.edgeEditMode, storeEdges]);

  return {
    deleteOperation,
    yankOperation,
    pasteOperation,
    deleteFocusedNode,
    yankFocusedNode,
    deleteSelection,
    yankSelection,
    changeOperation,
    createEdgeOperation,
    moveFocusedNode,
    moveSelectedNodes,
    getConnectedEdgeIds,
    deleteSelectedEdge,
    getSelectedEdgeSourceId,
    getSelectedEdgeTargetId
  };
};
