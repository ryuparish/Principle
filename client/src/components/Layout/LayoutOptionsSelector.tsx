import React, { useState, useEffect, useCallback } from 'react';
import './LayoutOptionsSelector.css';

export interface LayoutOptions {
  algorithm: 'layered' | 'force' | 'mrtree';
  direction: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';
}

interface LayoutOptionsSelectorProps {
  onSelect: (options: LayoutOptions) => void;
  onClose: () => void;
}

type SelectorSection = 'algorithm' | 'direction';

const ALGORITHMS = [
  { id: 'layered' as const, name: 'Layered', description: 'Hierarchical layout with crossing minimization', icon: '📊' },
  { id: 'force' as const, name: 'Force', description: 'Physics-based simulation layout', icon: '⚡' },
  { id: 'mrtree' as const, name: 'Tree', description: 'Optimized for tree structures', icon: '🌳' },
];

const DIRECTIONS = [
  { id: 'DOWN' as const, name: 'Top to Bottom', description: 'Root nodes at top', icon: '⬇️' },
  { id: 'RIGHT' as const, name: 'Left to Right', description: 'Root nodes at left', icon: '➡️' },
  { id: 'UP' as const, name: 'Bottom to Top', description: 'Root nodes at bottom', icon: '⬆️' },
  { id: 'LEFT' as const, name: 'Right to Left', description: 'Root nodes at right', icon: '⬅️' },
];

export const LayoutOptionsSelector: React.FC<LayoutOptionsSelectorProps> = ({
  onSelect,
  onClose
}) => {
  const [activeSection, setActiveSection] = useState<SelectorSection>('algorithm');
  const [algorithmIndex, setAlgorithmIndex] = useState(0);
  const [directionIndex, setDirectionIndex] = useState(0);

  const handleSelect = useCallback(() => {
    onSelect({
      algorithm: ALGORITHMS[algorithmIndex].id,
      direction: DIRECTIONS[directionIndex].id
    });
  }, [algorithmIndex, directionIndex, onSelect]);

  // Vim keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          if (activeSection === 'algorithm') {
            if (algorithmIndex < ALGORITHMS.length - 1) {
              setAlgorithmIndex(i => i + 1);
            } else {
              setActiveSection('direction');
            }
          } else {
            setDirectionIndex(i => i < DIRECTIONS.length - 1 ? i + 1 : i);
          }
          break;

        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          if (activeSection === 'direction') {
            if (directionIndex > 0) {
              setDirectionIndex(i => i - 1);
            } else {
              setActiveSection('algorithm');
              setAlgorithmIndex(ALGORITHMS.length - 1);
            }
          } else {
            setAlgorithmIndex(i => i > 0 ? i - 1 : i);
          }
          break;

        case 'Tab':
          e.preventDefault();
          setActiveSection(s => s === 'algorithm' ? 'direction' : 'algorithm');
          break;

        case 'Enter':
          e.preventDefault();
          handleSelect();
          break;

        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, algorithmIndex, directionIndex, handleSelect, onClose]);

  return (
    <div className="layout-options-overlay">
      <div className="layout-options-selector">
        <div className="layout-options-header">
          Auto-Layout Options
        </div>

        {/* Section 1: Algorithm */}
        <div className="layout-options-section">
          <div className="layout-options-section-header">Algorithm</div>
          <div className="layout-options-list">
            {ALGORITHMS.map((algo, index) => (
              <div
                key={algo.id}
                className={`layout-option ${
                  activeSection === 'algorithm' && index === algorithmIndex ? 'selected' : ''
                }`}
                onMouseEnter={() => {
                  setActiveSection('algorithm');
                  setAlgorithmIndex(index);
                }}
                onClick={handleSelect}
              >
                <div className="layout-option-icon">{algo.icon}</div>
                <div className="layout-option-info">
                  <div className="layout-option-name">{algo.name}</div>
                  <div className="layout-option-description">{algo.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Direction */}
        <div className="layout-options-section">
          <div className="layout-options-section-header">Direction</div>
          <div className="layout-options-list">
            {DIRECTIONS.map((dir, index) => (
              <div
                key={dir.id}
                className={`layout-option ${
                  activeSection === 'direction' && index === directionIndex ? 'selected' : ''
                }`}
                onMouseEnter={() => {
                  setActiveSection('direction');
                  setDirectionIndex(index);
                }}
                onClick={handleSelect}
              >
                <div className="layout-option-icon">{dir.icon}</div>
                <div className="layout-option-info">
                  <div className="layout-option-name">{dir.name}</div>
                  <div className="layout-option-description">{dir.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="layout-options-hint">
          <kbd>j/k</kbd> navigate <kbd>Tab</kbd> switch section <kbd>Enter</kbd> apply <kbd>Esc</kbd> cancel
        </div>
      </div>
    </div>
  );
};
