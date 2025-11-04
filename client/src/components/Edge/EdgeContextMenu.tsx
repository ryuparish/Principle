import React, { useState, useEffect } from 'react';
import { Edge } from 'reactflow';
import { useConceptMapStore } from "../../store/conceptMapStore";
import './EdgeContextMenu.css';

interface EdgeContextMenuProps {
  edge: Edge;
  x: number;
  y: number;
  onClose: () => void;
}

const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({
  edge,
  x,
  y,
  onClose
}) => {
  const { updateEdge, deleteEdge } = useConceptMapStore();
  const [label, setLabel] = useState(edge.label?.toString() || '');

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.edge-context-menu')) {
        onClose();
      }
    };

    // Delay adding the listener to avoid immediate close
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  const handleSaveLabel = async () => {
    try {
      await updateEdge(edge.id, { label: label || undefined });
      onClose();
    } catch (error) {
      console.error('Failed to update edge label:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEdge(edge.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete edge:', error);
    }
  };

  return (
    <div
      className="edge-context-menu"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="menu-section">
        <label>Label:</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Connection label"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSaveLabel();
            }
          }}
        />
        <button onClick={handleSaveLabel}>Save</button>
      </div>

      <div className="menu-divider" />

      <button
        className="delete-button"
        onClick={handleDelete}
      >
        Delete Connection
      </button>
    </div>
  );
};

export default EdgeContextMenu;
