import React, { useState, memo, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MindmapNode } from '../../types';
import NodeEditorModal from './NodeEditorModal';
import { useVim } from '../../contexts/VimContext';
import { useMindmapStore } from '../../store/mindmapStore';
import './CustomNode.css';

interface CustomNodeData {
  label: string;
  node: MindmapNode;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data, isConnectable, id }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [titleValue, setTitleValue] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const vim = useVim();
  const { updateNode } = useMindmapStore();

  // Check if this node is focused and in insert mode
  const isFocused = vim.state.focusedNodeId === id;
  const isInInsertMode = vim.state.mode === 'insert' && isFocused;

  // Update title value when label changes
  useEffect(() => {
    setTitleValue(data.label);
  }, [data.label]);

  // Auto-focus input when entering insert mode
  useEffect(() => {
    if (isInInsertMode && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isInInsertMode]);

  // Open editor modal when vim requests it
  useEffect(() => {
    if (vim.state.editorNodeId === id && !isEditorOpen) {
      setIsEditorOpen(true);
      vim.closeEditor(); // Clear the flag after opening
    }
  }, [vim.state.editorNodeId, id, isEditorOpen, vim]);

  // Save title when exiting insert mode
  const prevInsertModeRef = useRef(isInInsertMode);
  useEffect(() => {
    // If we were in insert mode and now we're not, save the title
    if (prevInsertModeRef.current && !isInInsertMode && titleValue !== data.label) {
      updateNode(id, { title: titleValue });
    }
    prevInsertModeRef.current = isInInsertMode;
  }, [isInInsertMode, titleValue, data.label, id, updateNode]);

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

  // Handle title input change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value);
  };

  // Handle blur - save the title when leaving insert mode
  const handleTitleBlur = async () => {
    if (titleValue !== data.label) {
      await updateNode(id, { title: titleValue });
    }
  };

  // Check if node has content
  const hasContent = data.node.content &&
    data.node.content.content &&
    data.node.content.content.length > 0;

  return (
    <>
      <div
        className={`custom-node ${isFocused ? 'focused' : ''} ${isInInsertMode ? 'insert-mode' : ''}`}
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
          {isInInsertMode ? (
            <input
              ref={inputRef}
              type="text"
              className="node-title-input"
              value={titleValue}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
            />
          ) : (
            <div className="node-title">{data.label}</div>
          )}
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
