import React from 'react';
import {
  EdgeProps,
  getStraightPath,
  EdgeLabelRenderer,
  BaseEdge,
} from 'reactflow';
import './SpreadEdge.css';

/**
 * DirectEdge - A completely straight line from source to target.
 * Unlike SpreadStraightEdge, this does NOT apply any spreading offset.
 * The line goes directly from the source handle to the target handle.
 */
export const DirectEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
  markerStart,
  label,
  labelStyle,
  labelShowBg,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
}) => {
  // Get straight path with NO offset - direct line
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

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

export default DirectEdge;
