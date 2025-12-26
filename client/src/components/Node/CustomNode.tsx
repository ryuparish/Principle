import React, { useState, memo, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ConceptMapNode } from '../../types';
import { NodeShape, SHAPE_CONFIGS } from '../../types/shapes';
import { SVG_SHAPES } from './shapes/SvgShapes';
import NodeEditorModal from './NodeEditorModal';
import { useVim } from '../../contexts/VimContext';
import { useConceptMapStore } from "../../store/conceptMapStore";
import { TagChip } from '../Tags/TagChip';
import { useTagStore } from '../../store/tagStore';
import './CustomNode.css';
import './NodeShapes.css';

interface CustomNodeData {
  label: string;
  node: ConceptMapNode;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data, isConnectable, id }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [titleValue, setTitleValue] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const vim = useVim();
  const { updateNode } = useConceptMapStore();
  const { toggleTagFilter } = useTagStore();

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

  // Handle tag click - toggle filter
  const handleTagClick = (tagName: string) => {
    toggleTagFilter(tagName);
  };

  // Get shape config
  const shape = (data.node.shape as NodeShape) || 'rounded-rectangle';
  const shapeConfig = SHAPE_CONFIGS[shape];
  const SvgShapeComponent = shapeConfig.useSvg ? SVG_SHAPES[shape as keyof typeof SVG_SHAPES] : null;

  // Render handles dynamically based on shape
  const renderHandles = () => {
    const handles = [];
    const offsets = shapeConfig.handleOffsets || {};

    if (shapeConfig.handles.top) {
      const topOffset = offsets.top || {};
      handles.push(
        <Handle
          key="top"
          id="top"
          type="source"
          position={Position.Top}
          isConnectable={isConnectable}
          className="node-handle"
          style={{
            top: topOffset.y || '0%',
            left: `calc(50% + ${topOffset.x || '0%'})`
          }}
        />
      );
    }
    if (shapeConfig.handles.right) {
      const rightOffset = offsets.right || {};
      handles.push(
        <Handle
          key="right"
          id="right"
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className="node-handle"
          style={{
            right: rightOffset.x || '0%',
            top: `calc(50% + ${rightOffset.y || '0%'})`
          }}
        />
      );
    }
    if (shapeConfig.handles.bottom) {
      const bottomOffset = offsets.bottom || {};
      handles.push(
        <Handle
          key="bottom"
          id="bottom"
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="node-handle"
          style={{
            bottom: bottomOffset.y ? `calc(0% - ${bottomOffset.y})` : '0%',
            left: `calc(50% + ${bottomOffset.x || '0%'})`
          }}
        />
      );
    }
    if (shapeConfig.handles.left) {
      const leftOffset = offsets.left || {};
      handles.push(
        <Handle
          key="left"
          id="left"
          type="source"
          position={Position.Left}
          isConnectable={isConnectable}
          className="node-handle"
          style={{
            left: leftOffset.x || '0%',
            top: `calc(50% + ${leftOffset.y || '0%'})`
          }}
        />
      );
    }
    return handles;
  };

  return (
    <>
      <div
        className={`custom-node ${shapeConfig.cssClass || ''} ${isFocused ? 'focused' : ''} ${isInInsertMode ? 'insert-mode' : ''}`}
        onClick={handleNodeClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {renderHandles()}

        {/* SVG background for complex shapes */}
        {SvgShapeComponent && (
          <div className="svg-shape-background">
            <SvgShapeComponent
              fill={data.node.style?.backgroundColor || 'var(--theme-nodeBackground, white)'}
              stroke={data.node.style?.borderColor || 'var(--theme-nodeBorder, #0066cc)'}
              strokeWidth={data.node.style?.borderWidth || 2}
            />
          </div>
        )}

        {/* Node content */}
        <div className={`${SvgShapeComponent ? 'svg-shape-content' : ''} ${shapeConfig.contentClass || ''} node-content`}>
          <div className="node-main">
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
              <>
                <div className="node-title">{data.label}</div>
                {data.node.tags && data.node.tags.length > 0 && (
                  <div className="node-tags">
                    {data.node.tags.map((tag, index) => (
                      <TagChip
                        key={`${tag}-${index}`}
                        tagName={tag}
                        size="sm"
                        onClick={handleTagClick}
                        interactive={true}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          {hasContent && (
            <div className="node-has-content-indicator">📝</div>
          )}
        </div>
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
