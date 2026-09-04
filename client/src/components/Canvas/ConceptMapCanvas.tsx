import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeChange,
  applyNodeChanges,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useConceptMapStore } from "../../store/conceptMapStore";
import { queueApi } from '../../api/queue.api';
import CustomNode from '../Node/CustomNode';
import EdgeContextMenu from '../Edge/EdgeContextMenu';
import { useKeyboardHandler } from '../../hooks/useKeyboardHandler';
import VimStatusBar from '../Vim/VimStatusBar';
import VimOverlay from '../Vim/VimOverlay';
import EdgeLabelEditor from '../Vim/EdgeLabelEditor';
import { VimProvider } from '../../contexts/VimContext';

const nodeTypes = {
  custom: CustomNode,
};

interface ConceptMapCanvasProps {
  conceptMapId: string;
  onOpenNodeDetail?: (nodeId: string) => void;
}

const ConceptMapCanvasInner: React.FC<ConceptMapCanvasProps> = ({ conceptMapId, onOpenNodeDetail }) => {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    loading,
    currentConceptMap,
    loadConceptMap,
    loadEdges,
    createNode,
    updateNodeLocal,
    deleteNodes,
    createEdge,
    deleteEdge
  } = useConceptMapStore();
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [edgeMenuState, setEdgeMenuState] = useState<{
    edge: Edge | null;
    x: number;
    y: number;
  } | null>(null);
  const { project } = useReactFlow();
  const currentConceptMapIdRef = React.useRef<string | null>(null);
  const draggedNodePositions = React.useRef<Map<string, { x: number; y: number }>>(new Map());

  // Initialize vim mode
  const { vim } = useKeyboardHandler();

  // Auto-focus first node when nodes are loaded
  useEffect(() => {
    if (vim.state.enabled && !vim.state.focusedNodeId && nodes.length > 0) {
      // Focus first node by default
      vim.setFocus(nodes[0].id);
    }
  }, [nodes, vim]);

  // Load concept map data when conceptMapId changes
  useEffect(() => {
    loadConceptMap(conceptMapId);
    loadEdges(conceptMapId);
  }, [conceptMapId, loadConceptMap, loadEdges]);

  // Sync store nodes to React Flow
  useEffect(() => {
    // Don't sync with stale data while loading from database
    if (loading) {
      return;
    }

    // Don't sync if store has data for a different concept map (global store persists across mounts)
    if (currentConceptMap?.id !== conceptMapId) {
      return;
    }

    // Check if concept map changed (explicit reload)
    const conceptMapChanged = currentConceptMapIdRef.current !== conceptMapId;
    if (conceptMapChanged) {
      currentConceptMapIdRef.current = conceptMapId;
    }

    setNodes((currentNodes) => {
      // If no current nodes, do full initialization from store
      if (currentNodes.length === 0 && storeNodes.length > 0) {
        return storeNodes.map((node) => ({
          id: node.id,
          type: 'custom',
          position: node.position,
          data: {
            label: node.title,
            node: node
          }
        }));
      }

      // If store is empty, clear nodes
      if (storeNodes.length === 0) {
        return [];
      }

      // Build ID sets for comparison
      const currentIds = new Set(currentNodes.map(n => n.id));
      const storeIds = new Set(storeNodes.map(n => n.id));

      // If node IDs changed (add/delete), do full replacement
      const idsChanged =
        currentIds.size !== storeIds.size ||
        !Array.from(storeIds).every(id => currentIds.has(id));

      // Only sync positions if concept map changed OR IDs changed (add/delete)
      if (conceptMapChanged || idsChanged) {
        return storeNodes.map((node) => ({
          id: node.id,
          type: 'custom',
          position: node.position,
          data: {
            label: node.title,
            node: node
          }
        }));
      }

      // Otherwise, preserve React Flow positions and only update data properties
      return currentNodes.map((currentNode) => {
        const storeNode = storeNodes.find((n) => n.id === currentNode.id);
        if (!storeNode) return currentNode;

        return {
          ...currentNode,
          // Preserve position from React Flow, only update data
          data: {
            label: storeNode.title,
            node: storeNode
          }
        };
      });
    });
  }, [storeNodes, conceptMapId, loading, currentConceptMap]);

  // Convert store edges to React Flow edges
  useEffect(() => {
    const reactFlowEdges: Edge[] = storeEdges.map((edge) => ({
      id: edge.id,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      label: edge.label,
      type: edge.style.type || 'default',
      animated: edge.style.animated || false,
      style: {
        stroke: edge.style.strokeColor || '#b1b1b7',
        strokeWidth: edge.style.strokeWidth || 2,
        strokeDasharray: edge.style.strokeDasharray
      }
    }));
    setEdges(reactFlowEdges);
  }, [storeEdges]);

  // Handle node changes (drag, select, etc.)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));

      // Track positions and publish to queue when dragging stops
      changes.forEach((change) => {
        if (change.type === 'position') {
          // Store position while dragging
          if (change.dragging === true && change.position) {
            draggedNodePositions.current.set(change.id, change.position);
          }

          // When drag stops, publish the last known position
          if (change.dragging === false) {
            const finalPosition = draggedNodePositions.current.get(change.id);

            if (finalPosition) {
              // Update store immediately (optimistic update)
              updateNodeLocal(change.id, { position: finalPosition });

              // Publish to queue for background processing
              queueApi.publish({
                nodeId: change.id,
                position: finalPosition
              });

              // Clean up tracked position
              draggedNodePositions.current.delete(change.id);
            }
          }
        }
      });
    },
    [updateNodeLocal]
  );

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyNodeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      try {
        // Create edge in database - React Flow edge will be added automatically via store update
        await createEdge(connection.source, connection.target);
      } catch (error) {
        console.error('Failed to create edge:', error);
      }
    },
    [createEdge]
  );

  const onEdgesDelete = useCallback(
    async (edgesToDelete: Edge[]) => {
      for (const edge of edgesToDelete) {
        try {
          await deleteEdge(edge.id);
        } catch (error) {
          console.error('Failed to delete edge:', error);
        }
      }
    },
    [deleteEdge]
  );

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setEdgeMenuState({
        edge,
        x: event.clientX,
        y: event.clientY
      });
    },
    []
  );

  // Track selected nodes
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      setSelectedNodeIds(selectedNodes.map(n => n.id));
    },
    []
  );

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't delete nodes if user is typing in an editable element
      const target = event.target as HTMLElement;
      const isEditableElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isEditableElement) {
        return; // Let the editor handle the keypress
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodeIds.length > 0) {
        // Prevent default backspace navigation
        event.preventDefault();
        deleteNodes(selectedNodeIds);
        setSelectedNodeIds([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, deleteNodes]);

  // Handle double-click on node to open detail page
  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (onOpenNodeDetail) {
        onOpenNodeDetail(node.id);
      }
    },
    [onOpenNodeDetail]
  );

  // Handle canvas click to create new node
  const onPaneClick = useCallback(
    async (event: React.MouseEvent) => {
      if ((event.target as HTMLElement).classList.contains('react-flow__pane')) {
        // Convert screen coordinates to flow coordinates (accounts for zoom and pan)
        const position = project({
          x: event.clientX,
          y: event.clientY,
        });

        try {
          await createNode('New Node', position);
        } catch (error) {
          console.error('Failed to create node:', error);
        }
      }
    },
    [createNode, project]
  );

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onEdgeContextMenu={onEdgeContextMenu}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        selectionOnDrag
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Meta"
        fitView
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
        <VimOverlay vimState={vim.state} />
      </ReactFlow>

      {edgeMenuState && (
        <EdgeContextMenu
          edge={edgeMenuState.edge!}
          x={edgeMenuState.x}
          y={edgeMenuState.y}
          onClose={() => setEdgeMenuState(null)}
        />
      )}

      {vim.state.edgeLabelEditorId && (
        <EdgeLabelEditor edgeId={vim.state.edgeLabelEditorId} />
      )}

      <VimStatusBar vimState={vim.state} />
    </div>
  );
};

const ConceptMapCanvas: React.FC<ConceptMapCanvasProps> = (props) => {
  return (
    <VimProvider>
      <ReactFlowProvider>
        <ConceptMapCanvasInner {...props} />
      </ReactFlowProvider>
    </VimProvider>
  );
};

export default ConceptMapCanvas;
