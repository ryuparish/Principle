import React, { useMemo } from 'react';
import {
  EdgeProps,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  EdgeLabelRenderer,
  BaseEdge,
  Position,
} from 'reactflow';
import { useEdgesContext } from '../../contexts/EdgesContext';
import './SpreadEdge.css';

// Offset amount for each sibling edge (pixels)
const SPREAD_OFFSET = 35;

interface SpreadEdgeProps extends EdgeProps {
  pathType?: 'default' | 'straight' | 'step' | 'smoothstep';
}

/**
 * Get the spread direction based on handle position.
 * Top/Bottom handles spread horizontally (row along X axis)
 * Left/Right handles spread vertically (row along Y axis)
 */
function getSpreadDirection(position: Position): { x: number; y: number } {
  switch (position) {
    case Position.Top:
    case Position.Bottom:
      // Spread horizontally for top/bottom handles
      return { x: 1, y: 0 };
    case Position.Left:
    case Position.Right:
      // Spread vertically for left/right handles
      return { x: 0, y: 1 };
    default:
      return { x: 1, y: 0 };
  }
}

/**
 * Custom edge component that spreads out multiple edges connecting to the same handle.
 * Edges fan out in a clean row at each connection point:
 * - Top/Bottom handles: horizontal row
 * - Left/Right handles: vertical row
 */
export const SpreadEdge: React.FC<SpreadEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  markerStart,
  label,
  labelStyle,
  labelShowBg,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  pathType = 'default',
  source,
  target,
  sourceHandleId,
  targetHandleId,
}) => {
  const { edges: contextEdges } = useEdgesContext();

  // Calculate offset for this edge based on sibling edges sharing same handle
  const { offsetTargetX, offsetTargetY, offsetSourceX, offsetSourceY } = useMemo(() => {
    // Find all edges that share the same target node + handle
    const allTargetEdges = contextEdges.filter(
      (e) =>
        e.targetNodeId === target &&
        (e.targetHandleId || null) === (targetHandleId || null)
    );

    // Find all edges that share the same source node + handle
    const allSourceEdges = contextEdges.filter(
      (e) =>
        e.sourceNodeId === source &&
        (e.sourceHandleId || null) === (sourceHandleId || null)
    );

    // Calculate target offset - spread in a row based on handle position
    let offsetTX = 0;
    let offsetTY = 0;

    if (allTargetEdges.length > 1) {
      // Sort by ID for consistent ordering
      const sortedTargetEdges = [...allTargetEdges].sort((a, b) =>
        a.id.localeCompare(b.id)
      );
      const targetIndex = sortedTargetEdges.findIndex((e) => e.id === id);
      const totalTargetEdges = sortedTargetEdges.length;

      // Center the group around zero
      const targetOffsetIndex = targetIndex - (totalTargetEdges - 1) / 2;

      // Get spread direction based on target handle position
      const spreadDir = getSpreadDirection(targetPosition);
      offsetTX = spreadDir.x * targetOffsetIndex * SPREAD_OFFSET;
      offsetTY = spreadDir.y * targetOffsetIndex * SPREAD_OFFSET;
    }

    // Calculate source offset - spread in a row based on handle position
    let offsetSX = 0;
    let offsetSY = 0;

    if (allSourceEdges.length > 1) {
      const sortedSourceEdges = [...allSourceEdges].sort((a, b) =>
        a.id.localeCompare(b.id)
      );
      const sourceIndex = sortedSourceEdges.findIndex((e) => e.id === id);
      const totalSourceEdges = sortedSourceEdges.length;

      const sourceOffsetIndex = sourceIndex - (totalSourceEdges - 1) / 2;

      // Get spread direction based on source handle position
      const spreadDir = getSpreadDirection(sourcePosition);
      offsetSX = spreadDir.x * sourceOffsetIndex * SPREAD_OFFSET;
      offsetSY = spreadDir.y * sourceOffsetIndex * SPREAD_OFFSET;
    }

    return {
      offsetTargetX: offsetTX,
      offsetTargetY: offsetTY,
      offsetSourceX: offsetSX,
      offsetSourceY: offsetSY,
    };
  }, [contextEdges, target, targetHandleId, source, sourceHandleId, id, targetPosition, sourcePosition]);

  // Apply offsets to positions
  const adjustedSourceX = sourceX + offsetSourceX;
  const adjustedSourceY = sourceY + offsetSourceY;
  const adjustedTargetX = targetX + offsetTargetX;
  const adjustedTargetY = targetY + offsetTargetY;

  // Get path based on type
  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (pathType === 'straight') {
    [edgePath, labelX, labelY] = getStraightPath({
      sourceX: adjustedSourceX,
      sourceY: adjustedSourceY,
      targetX: adjustedTargetX,
      targetY: adjustedTargetY,
    });
  } else if (pathType === 'step' || pathType === 'smoothstep') {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX: adjustedSourceX,
      sourceY: adjustedSourceY,
      sourcePosition,
      targetX: adjustedTargetX,
      targetY: adjustedTargetY,
      targetPosition,
      borderRadius: pathType === 'smoothstep' ? 10 : 0,
    });
  } else {
    // Default: bezier
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX: adjustedSourceX,
      sourceY: adjustedSourceY,
      sourcePosition,
      targetX: adjustedTargetX,
      targetY: adjustedTargetY,
      targetPosition,
    });
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              ...labelStyle,
            }}
            className="nodrag nopan edge-label"
          >
            {labelShowBg && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  padding: Array.isArray(labelBgPadding)
                    ? `${labelBgPadding[1]}px ${labelBgPadding[0]}px`
                    : labelBgPadding,
                  borderRadius: labelBgBorderRadius,
                  ...labelBgStyle,
                }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

// Create specific edge type components for each path style
export const SpreadBezierEdge: React.FC<EdgeProps> = (props) => (
  <SpreadEdge {...props} pathType="default" />
);

export const SpreadStraightEdge: React.FC<EdgeProps> = (props) => (
  <SpreadEdge {...props} pathType="straight" />
);

export const SpreadStepEdge: React.FC<EdgeProps> = (props) => (
  <SpreadEdge {...props} pathType="step" />
);

export const SpreadSmoothStepEdge: React.FC<EdgeProps> = (props) => (
  <SpreadEdge {...props} pathType="smoothstep" />
);

export default SpreadEdge;
