import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  NodeChange,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  ReactFlowProvider,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './ConceptMapCanvas.css';
import { useConceptMapStore } from "../../store/conceptMapStore";
import { useTagStore } from "../../store/tagStore";
import { queueApi } from '../../api/queue.api';
import CustomNode from '../Node/CustomNode';
import EdgeContextMenu from '../Edge/EdgeContextMenu';
import { useKeyboardHandler } from '../../hooks/useKeyboardHandler';
import VimStatusBar from '../Vim/VimStatusBar';
import VimOverlay from '../Vim/VimOverlay';
import EdgeLabelEditor from '../Vim/EdgeLabelEditor';
import { VimProvider } from '../../contexts/VimContext';
import Spinner from '../Loading/Spinner';
import SearchBar from '../Search/SearchBar';
import { TagSidebar } from '../Tags/TagSidebar';
import { ThemePicker } from '../Theme/ThemePicker';
import { InlineTagInput } from '../Tags/InlineTagInput';

const nodeTypes = {
  custom: CustomNode,
};

interface ConceptMapCanvasProps {
  conceptMapId: string;
}

const ConceptMapCanvasInner: React.FC<ConceptMapCanvasProps> = ({ conceptMapId }) => {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    loading,
    currentConceptMap,
    loadConceptMap,
    createNode,
    updateNodeLocal,
    deleteNodes,
    createEdge,
    deleteEdge
  } = useConceptMapStore();
  const { getFilteredNodes, syncTagsFromNodes, clearFilters } = useTagStore();
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [edgeMenuState, setEdgeMenuState] = useState<{
    edge: Edge | null;
    x: number;
    y: number;
  } | null>(null);
  const { project, setCenter, getNode } = useReactFlow();
  const currentConceptMapIdRef = React.useRef<string | null>(null);
  const draggedNodePositions = React.useRef<Map<string, { x: number; y: number }>>(new Map());
  const initialFocusHandledRef = React.useRef<boolean>(false);
  const creatingInitialNodeRef = React.useRef<boolean>(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [tagSidebarOpen, setTagSidebarOpen] = useState(false);

  // Initialize vim mode
  const { vim } = useKeyboardHandler();

  // Reset initial focus handler when concept map changes
  useEffect(() => {
    initialFocusHandledRef.current = false;
    creatingInitialNodeRef.current = false;
  }, [conceptMapId]);

  // Auto-focus closest node to viewport center when map loads (or create initial node)
  useEffect(() => {
    // Only run once per map load
    if (initialFocusHandledRef.current) {
      return;
    }

    // Don't run if we're already creating a node
    if (creatingInitialNodeRef.current) {
      return;
    }

    // Wait until we have loaded the concept map (don't require vim to be enabled!)
    if (!currentConceptMap || loading) {
      return;
    }

    // Mark as handled IMMEDIATELY to prevent race conditions
    initialFocusHandledRef.current = true;

    // Calculate viewport center in flow coordinates
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    const viewportCenter = project({ x: screenCenterX, y: screenCenterY });

    if (storeNodes.length === 0) {
      // No nodes - create one at center with map name (regardless of vim status)
      creatingInitialNodeRef.current = true;
      (async () => {
        try {
          const newNode = await createNode(
            currentConceptMap.name || 'Start',
            viewportCenter
          );
          // Only set focus if vim is enabled
          if (vim.state.enabled) {
            vim.setFocus(newNode.id);
          }
        } catch (error) {
          console.error('Failed to create initial node:', error);
        } finally {
          creatingInitialNodeRef.current = false;
        }
      })();
    } else if (nodes.length > 0) {
      // Find node closest to viewport center
      let closestNode = nodes[0];
      let minDistance = Infinity;

      nodes.forEach((node) => {
        // Get measured dimensions from React Flow node
        const reactFlowNode = getNode(node.id);
        const nodeWidth = reactFlowNode?.width || 150;
        const nodeHeight = reactFlowNode?.height || 50;

        // Calculate node center
        const nodeCenter = {
          x: node.position.x + nodeWidth / 2,
          y: node.position.y + nodeHeight / 2
        };

        // Calculate distance to viewport center
        const distance = Math.sqrt(
          Math.pow(nodeCenter.x - viewportCenter.x, 2) +
          Math.pow(nodeCenter.y - viewportCenter.y, 2)
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestNode = node;
        }
      });

      // Focus the closest node (only if vim is enabled)
      if (vim.state.enabled) {
        vim.setFocus(closestNode.id);
      }
    }
  }, [vim, storeNodes, nodes, currentConceptMap, loading, conceptMapId, project, getNode, createNode]);

  // Global keyboard shortcut for search (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Load concept map data when conceptMapId changes
  useEffect(() => {
    loadConceptMap(conceptMapId);
    // loadEdges is now called internally by loadConceptMap
  }, [conceptMapId, loadConceptMap]);

  // Sync tags from loaded nodes
  useEffect(() => {
    if (storeNodes.length > 0) {
      syncTagsFromNodes(storeNodes);
    }
  }, [storeNodes, syncTagsFromNodes]);

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

    // Apply tag filtering
    const filteredNodes = getFilteredNodes(storeNodes);

    setNodes((currentNodes) => {
      // If no current nodes, do full initialization from store
      if (currentNodes.length === 0 && filteredNodes.length > 0) {
        return filteredNodes.map((node) => ({
          id: node.id,
          type: 'custom',
          position: node.position,
          data: {
            label: node.title,
            node: node
          }
        }));
      }

      // If filtered nodes are empty, clear nodes
      if (filteredNodes.length === 0) {
        return [];
      }

      // Build ID sets for comparison
      const currentIds = new Set(currentNodes.map(n => n.id));
      const filteredIds = new Set(filteredNodes.map(n => n.id));

      // If node IDs changed (add/delete/filter), do full replacement
      const idsChanged =
        currentIds.size !== filteredIds.size ||
        !Array.from(filteredIds).every(id => currentIds.has(id));

      // Only sync positions if concept map changed OR IDs changed (add/delete/filter)
      if (conceptMapChanged || idsChanged) {
        return filteredNodes.map((node) => ({
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
        const storeNode = filteredNodes.find((n) => n.id === currentNode.id);
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
  }, [storeNodes, conceptMapId, loading, currentConceptMap, getFilteredNodes]);

  // Convert store edges to React Flow edges
  useEffect(() => {
    const reactFlowEdges: Edge[] = storeEdges.map((edge) => ({
      id: edge.id,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      sourceHandle: edge.sourceHandleId,
      targetHandle: edge.targetHandleId,
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
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      try {
        // Create edge in database - React Flow edge will be added automatically via store update
        await createEdge(
          connection.source,
          connection.target,
          connection.sourceHandle || undefined,
          connection.targetHandle || undefined
        );
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

  // Handle search node selection
  const handleSelectNode = useCallback(
    (nodeId: string) => {
      // Focus and center the selected node
      vim.setFocus(nodeId);

      // Get the actual React Flow node with measured dimensions
      const reactFlowNode = getNode(nodeId);
      if (reactFlowNode) {
        // Calculate the center of the node
        // React Flow stores measured width/height after render
        const nodeWidth = reactFlowNode.width || 150; // fallback to min-width
        const nodeHeight = reactFlowNode.height || 50; // fallback estimate

        const centerX = reactFlowNode.position.x + nodeWidth / 2;
        const centerY = reactFlowNode.position.y + nodeHeight / 2;

        setCenter(centerX, centerY, {
          zoom: 1.5,
          duration: 800
        });
      }

      setSearchOpen(false);
    },
    [vim, setCenter, getNode]
  );

  // Allow all connections (source-to-source allowed for bidirectional edges)
  const isValidConnection = useCallback(() => {
    return true;
  }, []);

  // Show loading spinner while initial load
  if (loading && nodes.length === 0) {
    return <Spinner fullscreen message="Loading concept map..." />;
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      {searchOpen && (
        <SearchBar
          onSelectNode={handleSelectNode}
          onClose={() => setSearchOpen(false)}
        />
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        isValidConnection={isValidConnection}
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

      {/* Inline Tag Input */}
      <InlineTagInput isOpen={vim.state.tagInputOpen} />

      <VimStatusBar vimState={vim.state} />

      {/* Toolbar */}
      <div className="canvas-toolbar">
        <ThemePicker />
        <button
          className="tag-sidebar-toggle"
          onClick={() => setTagSidebarOpen(!tagSidebarOpen)}
          title="Toggle Tags"
          aria-label="Toggle tag sidebar"
        >
          🏷️
        </button>
      </div>

      {/* Tag Sidebar */}
      <TagSidebar
        isOpen={tagSidebarOpen}
        onClose={() => {
          setTagSidebarOpen(false);
          clearFilters();
        }}
      />
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
