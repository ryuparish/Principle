import React, { useState, useEffect } from 'react';
import { PASTE_SHAPE_OPTIONS, PasteShapeOption } from '../../types/paste.types';
import './PasteShapeSelector.css';

interface PasteShapeSelectorProps {
  count: number;
  currentShape?: string;
  onSelect: (shape: PasteShapeOption) => void;
  onClose: () => void;
}

export const PasteShapeSelector: React.FC<PasteShapeSelectorProps> = ({
  count,
  currentShape,
  onSelect,
  onClose
}) => {
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const currentIndex = PASTE_SHAPE_OPTIONS.findIndex(opt => opt.id === currentShape);
    return currentIndex >= 0 ? currentIndex : 0;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => i < PASTE_SHAPE_OPTIONS.length - 1 ? i + 1 : i);
          break;
        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => i > 0 ? i - 1 : i);
          break;
        case 'Enter':
          e.preventDefault();
          onSelect(PASTE_SHAPE_OPTIONS[selectedIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onSelect, onClose]);

  return (
    <div className="paste-shape-selector-overlay">
      <div className="paste-shape-selector">
        <div className="paste-shape-header">
          <h3>Paste Shape</h3>
          <p className="paste-shape-count">Pasting {count} {count === 1 ? 'copy' : 'copies'}</p>
        </div>

        <div className="paste-shape-list">
          {PASTE_SHAPE_OPTIONS.map((option, index) => (
            <div
              key={option.id}
              className={`paste-shape-option ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => onSelect(option)}
            >
              <div className="paste-shape-icon">
                {getShapeIcon(option.id)}
              </div>
              <div className="paste-shape-info">
                <div className="paste-shape-name">{option.name}</div>
                <div className="paste-shape-description">{option.description}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="paste-shape-hints">
          <span><kbd>j</kbd>/<kbd>k</kbd> navigate</span>
          <span><kbd>Enter</kbd> select</span>
          <span><kbd>Esc</kbd> cancel</span>
        </div>
      </div>
    </div>
  );
};

function getShapeIcon(shape: string): string {
  switch (shape) {
    case 'grid':
      return '⊞';
    case 'tree':
      return '⋮';
    case 'line':
      return '—';
    case 'radial':
      return '✦';
    case 'cluster':
      return '◉';
    default:
      return '•';
  }
}
