import React, { useState, useRef, useEffect } from 'react';
import { NodeShape, SHAPE_CONFIGS } from '../../types/shapes';
import { SVG_SHAPES } from './shapes/SvgShapes';
import './ShapePicker.css';

interface ShapePickerProps {
  currentShape: NodeShape;
  onShapeSelect: (shape: NodeShape) => void;
}

export const ShapePicker: React.FC<ShapePickerProps> = ({
  currentShape,
  onShapeSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Group shapes by category
  const shapesByCategory = Object.entries(SHAPE_CONFIGS).reduce((acc, [key, config]) => {
    const category = config.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push({ key: key as NodeShape, config });
    return acc;
  }, {} as Record<string, Array<{ key: NodeShape; config: typeof SHAPE_CONFIGS[NodeShape] }>>);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleShapeClick = (shape: NodeShape) => {
    onShapeSelect(shape);
    setIsOpen(false);
  };

  const currentConfig = SHAPE_CONFIGS[currentShape];

  return (
    <div className="shape-picker" ref={dropdownRef}>
      <button
        className="shape-picker-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select node shape"
        title="Change node shape"
      >
        <span className="shape-picker-icon">▢</span>
        <span className="shape-picker-label">{currentConfig.name}</span>
        <span className="shape-picker-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="shape-picker-dropdown">
          {Object.entries(shapesByCategory).map(([category, shapes]) => (
            <div key={category} className="shape-picker-section">
              <div className="shape-picker-section-title">
                {category.charAt(0).toUpperCase() + category.slice(1)} Shapes
              </div>
              {shapes.map(({ key, config }) => {
                const SvgComponent = config.useSvg ? SVG_SHAPES[key as keyof typeof SVG_SHAPES] : null;
                return (
                  <button
                    key={key}
                    className={`shape-picker-item ${currentShape === key ? 'active' : ''}`}
                    onClick={() => handleShapeClick(key)}
                  >
                    <div className="shape-picker-preview">
                      {SvgComponent ? (
                        <SvgComponent
                          className="shape-preview-svg"
                          fill="#e0e0e0"
                          stroke="#666"
                          strokeWidth={1}
                        />
                      ) : (
                        <div className={`shape-preview-css ${config.cssClass}`} />
                      )}
                    </div>
                    <div className="shape-picker-info">
                      <div className="shape-picker-name">{config.name}</div>
                      <div className="shape-picker-description">{config.description}</div>
                    </div>
                    {currentShape === key && (
                      <span className="shape-picker-check">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
