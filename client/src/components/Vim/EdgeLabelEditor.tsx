import React, { useState, useEffect, useRef } from 'react';
import { useConceptMapStore } from "../../store/conceptMapStore";
import { useVim } from '../../contexts/VimContext';
import './EdgeLabelEditor.css';

interface EdgeLabelEditorProps {
  edgeId: string;
}

const EdgeLabelEditor: React.FC<EdgeLabelEditorProps> = ({ edgeId }) => {
  const { edges, updateEdge } = useConceptMapStore();
  const { closeEdgeLabelEditor } = useVim();
  const [label, setLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Find the edge
  const edge = edges.find(e => e.id === edgeId);

  // Initialize label from edge
  useEffect(() => {
    if (edge) {
      setLabel(edge.label || '');
    }
  }, [edge]);

  // Auto-focus input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeEdgeLabelEditor();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [label, closeEdgeLabelEditor]);

  const handleSave = async () => {
    if (!edge) return;

    try {
      await updateEdge(edge.id, { label: label || undefined });
      closeEdgeLabelEditor();
    } catch (error) {
      console.error('Failed to update edge label:', error);
    }
  };

  if (!edge) {
    closeEdgeLabelEditor();
    return null;
  }

  return (
    <div className="edge-label-editor-modal">
      <div className="edge-label-editor-content">
        <h3>Edit Edge Label</h3>
        <input
          ref={inputRef}
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Connection label"
          className="edge-label-input"
        />
        <div className="edge-label-editor-hint">
          <kbd>Enter</kbd> to save • <kbd>Esc</kbd> to cancel
        </div>
        <div className="edge-label-editor-actions">
          <button onClick={handleSave} className="save-button">
            Save (Enter)
          </button>
          <button onClick={closeEdgeLabelEditor} className="cancel-button">
            Cancel (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};

export default EdgeLabelEditor;
