import React, { useState, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MindmapNode } from '../../types';
import NodeEditorModal from './NodeEditorModal';
import './CustomNode.css';

interface CustomNodeData {
  label: string;
  node: MindmapNode;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data, isConnectable }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleNodeClick = (e: React.MouseEvent) => {
    // Prevent opening editor when dragging
    if (e.detail === 1) {
      // Single click - open editor
      setTimeout(() => {
        if (!isDragging) {
          setIsEditorOpen(true);
        }
      }, 200);
    }
  };

  const handleMouseDown = () => {
    setIsDragging(false);
    // Set dragging to true after a small delay
    setTimeout(() => setIsDragging(true), 100);
  };

  const handleMouseUp = () => {
    setTimeout(() => setIsDragging(false), 0);
  };

  // Check if node has content
  const hasContent = data.node.content &&
    data.node.content.content &&
    data.node.content.content.length > 0;

  return (
    <>
      <div
        className="custom-node"
        onClick={handleNodeClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="node-handle"
        />
        <div className="node-content">
          <div className="node-title">{data.label}</div>
          {hasContent && (
            <div className="node-has-content-indicator">📝</div>
          )}
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="node-handle"
        />
      </div>

      <NodeEditorModal
        node={data.node}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />
    </>
  );
};

export default memo(CustomNode);
