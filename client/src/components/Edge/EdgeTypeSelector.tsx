import React, { useState, useEffect, useCallback } from 'react';
import { EdgeTypePreset, EdgePathStyle, EdgeStyle, EDGE_TYPE_PRESETS, EDGE_PATH_STYLES } from '../../types';
import './EdgeTypeSelector.css';

interface EdgeTypeSelectorProps {
  currentEdgeType?: string;
  currentPathType?: EdgeStyle['type'];
  onSelect: (preset: EdgeTypePreset) => void;
  onClose: () => void;
}

type SelectorSection = 'relationship' | 'path';

// SVG path definitions for each edge type
const PATH_PREVIEW_PATHS: Record<EdgePathStyle['id'], string> = {
  default: 'M 5 15 Q 30 5 55 15',           // Bezier curve
  step: 'M 5 10 L 20 10 L 20 10 L 35 10 L 35 10 L 55 10', // Will use polyline for step
  smoothstep: 'M 5 15 Q 20 15 20 10 L 20 10 Q 20 5 35 5 L 55 5',
  straight: 'M 5 10 L 55 10',
  direct: 'M 5 10 L 55 10'                  // Same as straight visually
};

export const EdgeTypeSelector: React.FC<EdgeTypeSelectorProps> = ({
  currentEdgeType,
  currentPathType,
  onSelect,
  onClose
}) => {
  const [activeSection, setActiveSection] = useState<SelectorSection>('relationship');
  const [relationshipIndex, setRelationshipIndex] = useState(0);
  const [pathIndex, setPathIndex] = useState(0);

  // Set initial indices based on current values
  useEffect(() => {
    if (currentEdgeType) {
      const index = EDGE_TYPE_PRESETS.findIndex(p => p.id === currentEdgeType);
      if (index >= 0) setRelationshipIndex(index);
    }
  }, [currentEdgeType]);

  useEffect(() => {
    if (currentPathType) {
      const index = EDGE_PATH_STYLES.findIndex(p => p.id === currentPathType);
      if (index >= 0) setPathIndex(index);
    }
  }, [currentPathType]);

  // Handle selection - merge relationship preset with path type
  const handleSelect = useCallback((relIdx: number, pathIdx: number) => {
    const selectedPreset = EDGE_TYPE_PRESETS[relIdx];
    const selectedPathType = EDGE_PATH_STYLES[pathIdx].id;

    // Create merged preset with path type included
    const mergedPreset: EdgeTypePreset = {
      ...selectedPreset,
      style: {
        ...selectedPreset.style,
        type: selectedPathType
      }
    };
    onSelect(mergedPreset);
  }, [onSelect]);

  // Vim keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          if (activeSection === 'relationship') {
            if (relationshipIndex < EDGE_TYPE_PRESETS.length - 1) {
              setRelationshipIndex(i => i + 1);
            } else {
              // Move to path section
              setActiveSection('path');
            }
          } else {
            setPathIndex(i => i < EDGE_PATH_STYLES.length - 1 ? i + 1 : i);
          }
          break;

        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          if (activeSection === 'path') {
            if (pathIndex > 0) {
              setPathIndex(i => i - 1);
            } else {
              // Move back to relationship section
              setActiveSection('relationship');
              setRelationshipIndex(EDGE_TYPE_PRESETS.length - 1);
            }
          } else {
            setRelationshipIndex(i => i > 0 ? i - 1 : i);
          }
          break;

        case 'Tab':
          e.preventDefault();
          setActiveSection(s => s === 'relationship' ? 'path' : 'relationship');
          break;

        case 'Enter':
          e.preventDefault();
          handleSelect(relationshipIndex, pathIndex);
          break;

        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, relationshipIndex, pathIndex, handleSelect, onClose]);

  const handleRelationshipMouseEnter = useCallback((index: number) => {
    setActiveSection('relationship');
    setRelationshipIndex(index);
  }, []);

  const handlePathMouseEnter = useCallback((index: number) => {
    setActiveSection('path');
    setPathIndex(index);
  }, []);

  // Render path preview SVG for path style options
  const renderPathPreview = (pathType: EdgePathStyle['id']) => {
    const preset = EDGE_TYPE_PRESETS[relationshipIndex];
    const strokeColor = preset.style.strokeColor || '#b1b1b7';
    const strokeWidth = preset.style.strokeWidth || 2;

    // Use polyline for step to get right angles
    if (pathType === 'step') {
      return (
        <svg width="60" height="20" viewBox="0 0 60 20">
          <defs>
            <marker
              id={`path-preview-end-${pathType}`}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path
                d="M 0 0 L 8 4 L 0 8"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.5"
              />
            </marker>
          </defs>
          <polyline
            points="5,15 25,15 25,5 55,5"
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            markerEnd={`url(#path-preview-end-${pathType})`}
          />
        </svg>
      );
    }

    return (
      <svg width="60" height="20" viewBox="0 0 60 20">
        <defs>
          <marker
            id={`path-preview-end-${pathType}`}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path
              d="M 0 0 L 8 4 L 0 8"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
            />
          </marker>
        </defs>
        <path
          d={PATH_PREVIEW_PATHS[pathType]}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          markerEnd={`url(#path-preview-end-${pathType})`}
        />
      </svg>
    );
  };

  return (
    <div className="edge-type-selector-overlay">
      <div className="edge-type-selector">
        <div className="edge-type-selector-header">
          Select Edge Style
        </div>

        {/* Section 1: Relationship Type */}
        <div className="edge-type-section">
          <div className="edge-type-section-header">Relationship Type</div>
          <div className="edge-type-list">
            {EDGE_TYPE_PRESETS.map((preset, index) => (
              <div
                key={preset.id}
                className={`edge-type-option ${
                  activeSection === 'relationship' && index === relationshipIndex ? 'selected' : ''
                } ${index === relationshipIndex ? 'current' : ''}`}
                onMouseEnter={() => handleRelationshipMouseEnter(index)}
                onClick={() => handleSelect(index, pathIndex)}
              >
                <div className="edge-type-preview">
                  <svg width="60" height="20">
                    <defs>
                      {preset.style.markerEnd && preset.style.markerEnd !== 'none' && (
                        <marker
                          id={`preview-end-${preset.id}`}
                          markerWidth="8"
                          markerHeight="8"
                          refX="7"
                          refY="4"
                          orient="auto"
                        >
                          <path
                            d={preset.style.markerEnd === 'arrowclosed'
                              ? 'M 0 0 L 8 4 L 0 8 Z'
                              : 'M 0 0 L 8 4 L 0 8'}
                            fill={preset.style.markerEnd === 'arrowclosed'
                              ? preset.style.strokeColor
                              : 'none'}
                            stroke={preset.style.strokeColor}
                            strokeWidth="1.5"
                          />
                        </marker>
                      )}
                      {preset.style.markerStart && preset.style.markerStart !== 'none' && (
                        <marker
                          id={`preview-start-${preset.id}`}
                          markerWidth="8"
                          markerHeight="8"
                          refX="1"
                          refY="4"
                          orient="auto"
                        >
                          <path
                            d={preset.style.markerStart === 'arrowclosed'
                              ? 'M 8 0 L 0 4 L 8 8 Z'
                              : 'M 8 0 L 0 4 L 8 8'}
                            fill={preset.style.markerStart === 'arrowclosed'
                              ? preset.style.strokeColor
                              : 'none'}
                            stroke={preset.style.strokeColor}
                            strokeWidth="1.5"
                          />
                        </marker>
                      )}
                    </defs>
                    <line
                      x1="10"
                      y1="10"
                      x2="50"
                      y2="10"
                      stroke={preset.style.strokeColor}
                      strokeWidth={preset.style.strokeWidth}
                      strokeDasharray={preset.style.strokeDasharray}
                      markerEnd={preset.style.markerEnd && preset.style.markerEnd !== 'none'
                        ? `url(#preview-end-${preset.id})`
                        : undefined}
                      markerStart={preset.style.markerStart && preset.style.markerStart !== 'none'
                        ? `url(#preview-start-${preset.id})`
                        : undefined}
                    />
                  </svg>
                </div>

                <div className="edge-type-info">
                  <div className="edge-type-name">{preset.name}</div>
                  <div className="edge-type-description">{preset.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Path Style */}
        <div className="edge-type-section">
          <div className="edge-type-section-header">Path Style</div>
          <div className="edge-type-list">
            {EDGE_PATH_STYLES.map((pathStyle, index) => (
              <div
                key={pathStyle.id}
                className={`edge-type-option ${
                  activeSection === 'path' && index === pathIndex ? 'selected' : ''
                } ${index === pathIndex ? 'current' : ''}`}
                onMouseEnter={() => handlePathMouseEnter(index)}
                onClick={() => handleSelect(relationshipIndex, index)}
              >
                <div className="edge-type-preview">
                  {renderPathPreview(pathStyle.id)}
                </div>

                <div className="edge-type-info">
                  <div className="edge-type-name">{pathStyle.name}</div>
                  <div className="edge-type-description">{pathStyle.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="edge-type-selector-hint">
          <kbd>j/k</kbd> navigate • <kbd>Tab</kbd> switch section • <kbd>Enter</kbd> apply • <kbd>Esc</kbd> cancel
        </div>
      </div>
    </div>
  );
};
