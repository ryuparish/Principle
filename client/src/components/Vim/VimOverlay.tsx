import React, { useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { useConceptMapStore } from "../../store/conceptMapStore";
import { VimState } from '../../types/vim.types';
import './VimOverlay.css';

interface VimOverlayProps {
  vimState: VimState;
}

interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

const VimOverlay: React.FC<VimOverlayProps> = ({ vimState }) => {
  const { getNodes, getZoom, getViewport } = useReactFlow();
  const { edges } = useConceptMapStore();
  const [focusedNodePos, setFocusedNodePos] = useState<NodePosition | null>(null);
  const [selectedNodesPos, setSelectedNodesPos] = useState<Map<string, NodePosition>>(new Map());

  // Track viewport state for reactive updates
  const [viewport, setViewport] = useState(() => getViewport());
  const [zoom, setZoom] = useState(() => getZoom());
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  // Update viewport and zoom on every render (these change frequently)
  useEffect(() => {
    const updateViewportState = () => {
      setViewport(getViewport());
      setZoom(getZoom());

      // Also track node positions to detect drag events
      const nodes = getNodes();
      const positions = new Map();
      nodes.forEach(node => {
        positions.set(node.id, { x: node.position.x, y: node.position.y });
      });
      setNodePositions(positions);
    };

    // Initial update
    updateViewportState();

    // Use requestAnimationFrame for smooth tracking
    let rafId: number;
    const scheduleUpdate = () => {
      updateViewportState();
      rafId = requestAnimationFrame(scheduleUpdate);
    };
    rafId = requestAnimationFrame(scheduleUpdate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [getNodes, getViewport, getZoom]);

  useEffect(() => {
    if (!vimState.enabled) {
      setFocusedNodePos(null);
      setSelectedNodesPos(new Map());
      return;
    }

    const nodes = getNodes();

    // Update focused node position
    if (vimState.focusedNodeId) {
      const focusedNode = nodes.find(n => n.id === vimState.focusedNodeId);
      if (focusedNode) {
        // Calculate screen position accounting for zoom and pan
        const x = focusedNode.position.x * zoom + viewport.x;
        const y = focusedNode.position.y * zoom + viewport.y;
        const width = (focusedNode.width || 150) * zoom;
        const height = (focusedNode.height || 60) * zoom;

        setFocusedNodePos({ x, y, width, height });
      } else {
        setFocusedNodePos(null);
      }
    } else {
      setFocusedNodePos(null);
    }

    // Update selected nodes positions
    const newSelectedPos = new Map<string, NodePosition>();
    vimState.selectedNodeIds.forEach(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        const x = node.position.x * zoom + viewport.x;
        const y = node.position.y * zoom + viewport.y;
        const width = (node.width || 150) * zoom;
        const height = (node.height || 60) * zoom;
        newSelectedPos.set(nodeId, { x, y, width, height });
      }
    });
    setSelectedNodesPos(newSelectedPos);

  }, [vimState.focusedNodeId, vimState.selectedNodeIds, vimState.enabled, viewport, zoom, nodePositions, getNodes]);

  if (!vimState.enabled) {
    return null;
  }

  return (
    <svg className="vim-overlay" style={{ pointerEvents: 'none' }}>
      {/* Selection highlights */}
      {Array.from(selectedNodesPos.entries()).map(([nodeId, pos]) => (
        <rect
          key={`selection-${nodeId}`}
          className="vim-selection-rect"
          x={pos.x - 4}
          y={pos.y - 4}
          width={pos.width + 8}
          height={pos.height + 8}
          rx="8"
        />
      ))}

      {/* Focus highlight */}
      {focusedNodePos && (
        <>
          <rect
            className="vim-focus-rect"
            x={focusedNodePos.x - 6}
            y={focusedNodePos.y - 6}
            width={focusedNodePos.width + 12}
            height={focusedNodePos.height + 12}
            rx="10"
          />
          <rect
            className="vim-focus-rect-inner"
            x={focusedNodePos.x - 4}
            y={focusedNodePos.y - 4}
            width={focusedNodePos.width + 8}
            height={focusedNodePos.height + 8}
            rx="8"
          />
        </>
      )}

      {/* Edge mode line preview */}
      {vimState.edgeMode.active && vimState.edgeMode.sourceNodeId && (
        (() => {
          const nodes = getNodes();

          const sourceNode = nodes.find(n => n.id === vimState.edgeMode.sourceNodeId);
          const targetNode = vimState.edgeMode.targetNodeId
            ? nodes.find(n => n.id === vimState.edgeMode.targetNodeId)
            : null;

          if (!sourceNode) return null;

          const sourceX = sourceNode.position.x * zoom + viewport.x + ((sourceNode.width || 150) * zoom) / 2;
          const sourceY = sourceNode.position.y * zoom + viewport.y + ((sourceNode.height || 60) * zoom) / 2;

          let targetX = sourceX;
          let targetY = sourceY;

          if (targetNode) {
            targetX = targetNode.position.x * zoom + viewport.x + ((targetNode.width || 150) * zoom) / 2;
            targetY = targetNode.position.y * zoom + viewport.y + ((targetNode.height || 60) * zoom) / 2;
          } else if (focusedNodePos) {
            // Point to focused node if no target selected yet
            targetX = focusedNodePos.x + focusedNodePos.width / 2;
            targetY = focusedNodePos.y + focusedNodePos.height / 2;
          }

          return (
            <line
              className="vim-edge-preview"
              x1={sourceX}
              y1={sourceY}
              x2={targetX}
              y2={targetY}
              strokeDasharray="5,5"
            />
          );
        })()
      )}

      {/* Edge edit mode: highlight connected edges */}
      {vimState.edgeEditMode.active && vimState.edgeEditMode.edgeIds.length > 0 && (
        (() => {
          const nodes = getNodes();
          const { edgeIds, selectedIndex } = vimState.edgeEditMode;

          return edgeIds.map((edgeId, index) => {
            const edge = edges.find(e => e.id === edgeId);
            if (!edge) return null;

            const sourceNode = nodes.find(n => n.id === edge.sourceNodeId);
            const targetNode = nodes.find(n => n.id === edge.targetNodeId);
            if (!sourceNode || !targetNode) return null;

            const sourceX = sourceNode.position.x * zoom + viewport.x + ((sourceNode.width || 150) * zoom) / 2;
            const sourceY = sourceNode.position.y * zoom + viewport.y + ((sourceNode.height || 60) * zoom) / 2;
            const targetX = targetNode.position.x * zoom + viewport.x + ((targetNode.width || 150) * zoom) / 2;
            const targetY = targetNode.position.y * zoom + viewport.y + ((targetNode.height || 60) * zoom) / 2;

            const isSelected = index === selectedIndex;

            return (
              <line
                key={`edge-edit-${edgeId}`}
                className={isSelected ? 'vim-edge-edit-selected' : 'vim-edge-edit'}
                x1={sourceX}
                y1={sourceY}
                x2={targetX}
                y2={targetY}
              />
            );
          });
        })()
      )}
    </svg>
  );
};

export default VimOverlay;
