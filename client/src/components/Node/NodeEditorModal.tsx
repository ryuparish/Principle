import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { MindmapNode } from '../../types';
import { useMindmapStore } from '../../store/mindmapStore';
import TipTapEditor from '../Editor/TipTapEditor';
import './NodeEditorModal.css';

interface NodeEditorModalProps {
  node: MindmapNode;
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to validate TipTap content structure
const isValidTipTapContent = (content: any): boolean => {
  return content &&
         typeof content === 'object' &&
         content.type === 'doc' &&
         Array.isArray(content.content);
};

// Default empty TipTap document
const getDefaultContent = () => ({
  type: 'doc',
  content: []
});

const NodeEditorModal: React.FC<NodeEditorModalProps> = ({
  node,
  isOpen,
  onClose
}) => {
  const { updateNode } = useMindmapStore();
  const [title, setTitle] = useState(node.title);
  const [content, setContent] = useState(
    isValidTipTapContent(node.content)
      ? node.content
      : getDefaultContent()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Update local state when node prop changes
  useEffect(() => {
    setTitle(node.title);
    setContent(
      isValidTipTapContent(node.content)
        ? node.content
        : getDefaultContent()
    );
  }, [node]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await updateNode(node.id, { title, content });
      setSaveMessage('Saved');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('Failed to save node:', error);
      setSaveMessage('Error saving');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, updateNode, node.id, title, content]);

  const handleClose = useCallback(() => {
    handleSave();
    onClose();
  }, [handleSave, onClose]);

  // Global Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, handleClose]);

  // Auto-save after 1 second of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSave();
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, content, handleSave]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <input
            type="text"
            className="node-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Node Title"
            autoFocus
          />
          <div className="modal-actions">
            {saveMessage && (
              <span className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
                {saveMessage}
              </span>
            )}
            {isSaving && <span className="saving-indicator">Saving...</span>}
            <button className="close-button" onClick={handleClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="modal-body">
          <TipTapEditor
            content={content}
            onChange={setContent}
            placeholder="Write your notes here..."
          />
        </div>

        <div className="modal-footer">
          <div className="footer-info">
            <span className="node-id">ID: {node.id}</span>
            <span className="last-updated">
              Updated: {new Date(node.updatedAt).toLocaleString()}
            </span>
          </div>
          <button className="save-close-button" onClick={handleClose}>
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default NodeEditorModal;
