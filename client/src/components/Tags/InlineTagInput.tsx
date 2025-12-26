import React, { useCallback, useEffect } from 'react';
import { useVim } from '../../contexts/VimContext';
import { useTagStore } from '../../store/tagStore';
import { useConceptMapStore } from '../../store/conceptMapStore';
import { TagInput } from './TagInput';
import './InlineTagInput.css';

export const InlineTagInput: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const vim = useVim();
  const { addTagToNode } = useTagStore();
  const { updateNode, nodes } = useConceptMapStore();

  // Determine nodes to tag
  const nodesToTag = vim.state.mode === 'visual' && vim.state.selectedNodeIds.size > 0
    ? Array.from(vim.state.selectedNodeIds)
    : vim.state.focusedNodeId ? [vim.state.focusedNodeId] : [];

  // Get current tags from first node
  const currentNode = nodes.find(n => n.id === nodesToTag[0]);
  const currentTags = currentNode?.tags || [];

  // Handle tag addition to multiple nodes
  const handleTagsChange = useCallback(async (newTags: string[]) => {
    const addedTag = newTags[newTags.length - 1];
    if (!addedTag) return;

    // Add tag to all target nodes in parallel
    await Promise.all(
      nodesToTag.map(async (nodeId) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        const nodeTags = node.tags || [];
        if (nodeTags.includes(addedTag)) return; // Skip duplicates

        const updatedTags = [...nodeTags, addedTag];
        addTagToNode(nodeId, addedTag);
        await updateNode(nodeId, { tags: updatedTags });
      })
    );

    vim.closeTagInput(); // Close after adding
  }, [nodesToTag, nodes, addTagToNode, updateNode, vim]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') vim.closeTagInput();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, vim]);

  if (!isOpen || nodesToTag.length === 0) return null;

  return (
    <div className="inline-tag-input-overlay">
      <div className="inline-tag-input-container">
        <div className="inline-tag-input-header">
          {vim.state.mode === 'visual'
            ? `Tag ${nodesToTag.length} nodes:`
            : 'Tag node:'}
        </div>
        <TagInput
          nodeId={nodesToTag[0]}
          currentTags={currentTags}
          onTagsChange={handleTagsChange}
          placeholder="Type tag name..."
          autoFocus={true}
        />
      </div>
    </div>
  );
};
