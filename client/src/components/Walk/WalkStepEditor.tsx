import React, { useState, useEffect, useCallback } from 'react';
import { useWalkStore } from '../../store/walkStore';
import { useConceptMapStore } from '../../store/conceptMapStore';
import { WalkStep } from '../../types/walk';
import './WalkStepEditor.css';

interface WalkStepEditorProps {
  step: WalkStep;
  stepNumber: number;
  isOpen: boolean;
  onClose: () => void;
}

export const WalkStepEditor: React.FC<WalkStepEditorProps> = ({
  step,
  stepNumber,
  isOpen,
  onClose
}) => {
  const { updateStep } = useWalkStore();
  const { nodes } = useConceptMapStore();

  const [annotation, setAnnotation] = useState(step.annotation || '');
  const [zoomLevel, setZoomLevel] = useState(step.zoomLevel || 1.5);
  const [duration, setDuration] = useState<string>(
    step.duration ? String(step.duration / 1000) : ''
  );
  const [saving, setSaving] = useState(false);

  // Get node info
  const node = nodes.find((n) => n.id === step.nodeId);
  const nodeName = node?.title || 'Unknown Node';

  // Reset form when step changes
  useEffect(() => {
    setAnnotation(step.annotation || '');
    setZoomLevel(step.zoomLevel || 1.5);
    setDuration(step.duration ? String(step.duration / 1000) : '');
  }, [step]);

  // Handle save
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateStep(step.id, {
        annotation: annotation.trim() || undefined,
        zoomLevel,
        duration: duration ? parseFloat(duration) * 1000 : undefined
      });
      onClose();
    } catch (error) {
      console.error('Failed to update step:', error);
    } finally {
      setSaving(false);
    }
  }, [step.id, annotation, zoomLevel, duration, updateStep, onClose]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleSave]);

  if (!isOpen) return null;

  return (
    <div className="walk-step-editor-overlay" onClick={onClose}>
      <div
        className="walk-step-editor"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="walk-step-editor-header">
          <div className="walk-step-editor-title">
            <div className="walk-step-editor-step-number">{stepNumber}</div>
            <div className="walk-step-editor-node-name">{nodeName}</div>
          </div>
          <button
            className="walk-step-editor-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="walk-step-editor-body">
          {/* Annotation */}
          <div className="walk-step-editor-group">
            <label className="walk-step-editor-label">
              Annotation
            </label>
            <textarea
              className="walk-step-editor-textarea"
              value={annotation}
              onChange={(e) => setAnnotation(e.target.value)}
              placeholder="Add notes or commentary for this step..."
              autoFocus
            />
          </div>

          {/* Zoom Level */}
          <div className="walk-step-editor-group">
            <label className="walk-step-editor-label">
              Zoom Level
            </label>
            <div className="walk-step-editor-slider-container">
              <input
                type="range"
                className="walk-step-editor-slider"
                min="0.5"
                max="3"
                step="0.1"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              />
              <span className="walk-step-editor-slider-value">
                {zoomLevel.toFixed(1)}x
              </span>
            </div>
          </div>

          {/* Duration (Auto-advance) */}
          <div className="walk-step-editor-group">
            <label className="walk-step-editor-label">
              Auto-advance (optional)
            </label>
            <div className="walk-step-editor-duration">
              <input
                type="number"
                className="walk-step-editor-duration-input"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="0"
                min="0"
                step="0.5"
              />
              <span className="walk-step-editor-duration-unit">seconds</span>
            </div>
            <div className="walk-step-editor-duration-hint">
              Leave empty for manual navigation
            </div>
          </div>
        </div>

        <div className="walk-step-editor-footer">
          <button
            className="walk-step-editor-button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="walk-step-editor-button primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalkStepEditor;
