import React, { useState, useEffect } from 'react';
import { useWalkStore } from '../../store/walkStore';
import { useConceptMapStore } from '../../store/conceptMapStore';
import { Walk, WalkStep } from '../../types/walk';
import { WalkStepEditor } from './WalkStepEditor';
import './WalkPanel.css';

interface WalkPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conceptMapId: string;
  onStartPresentation?: () => void;
}

export const WalkPanel: React.FC<WalkPanelProps> = ({
  isOpen,
  onClose,
  conceptMapId,
  onStartPresentation
}) => {
  const {
    walks,
    currentWalk,
    isEditing,
    loadWalks,
    createWalk,
    deleteWalk,
    selectWalk,
    removeStep,
    startEditing,
    stopEditing,
    startPresentation
  } = useWalkStore();

  const { nodes } = useConceptMapStore();

  const [newWalkName, setNewWalkName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingStep, setEditingStep] = useState<{ step: WalkStep; index: number } | null>(null);

  // Load walks when panel opens
  useEffect(() => {
    if (isOpen && conceptMapId) {
      loadWalks(conceptMapId);
    }
  }, [isOpen, conceptMapId, loadWalks]);

  const handleCreateWalk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalkName.trim() || creating) return;

    setCreating(true);
    try {
      await createWalk({
        conceptMapId,
        name: newWalkName.trim()
      });
      setNewWalkName('');
    } catch (error) {
      console.error('Failed to create walk:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWalk = (walk: Walk, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete walk "${walk.name}"?`)) {
      deleteWalk(walk.id);
    }
  };

  const handleSelectWalk = (walk: Walk) => {
    if (currentWalk?.id === walk.id) {
      selectWalk(null);
    } else {
      selectWalk(walk);
    }
  };

  const handleRemoveStep = (stepId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeStep(stepId);
  };

  const handleStartPresentation = () => {
    if (currentWalk && currentWalk.steps.length > 0) {
      startPresentation(currentWalk);
      onStartPresentation?.();
      onClose();
    }
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      stopEditing();
    } else {
      startEditing();
    }
  };

  const getNodeTitle = (nodeId: string): string => {
    const node = nodes.find((n) => n.id === nodeId);
    return node?.title || 'Unknown Node';
  };

  const getStepAnnotationPreview = (step: WalkStep): string | null => {
    if (!step.annotation) return null;
    // Strip HTML and truncate
    const text = step.annotation.replace(/<[^>]*>/g, '').trim();
    return text.length > 40 ? text.substring(0, 40) + '...' : text;
  };

  const handleEditStep = (step: WalkStep, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStep({ step, index });
  };

  const handleCloseStepEditor = () => {
    setEditingStep(null);
  };

  if (!isOpen) return null;

  return (
    <div className="walk-panel-overlay" onClick={onClose}>
      <div className="walk-panel" onClick={(e) => e.stopPropagation()}>
        <div className="walk-panel-header">
          <h2 className="walk-panel-title">Walks</h2>
          <button
            className="walk-panel-close"
            onClick={onClose}
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        {/* Create Walk Form */}
        <div className="walk-create-section">
          <form className="walk-create-form" onSubmit={handleCreateWalk}>
            <input
              type="text"
              className="walk-create-input"
              placeholder="New walk name..."
              value={newWalkName}
              onChange={(e) => setNewWalkName(e.target.value)}
              disabled={creating}
            />
            <button
              type="submit"
              className="walk-create-button"
              disabled={!newWalkName.trim() || creating}
            >
              {creating ? '...' : '+ New'}
            </button>
          </form>
        </div>

        {/* Edit Mode Indicator */}
        {isEditing && currentWalk && (
          <div className="walk-edit-indicator">
            <span className="walk-edit-indicator-icon">+</span>
            <span>Click nodes to add them to "{currentWalk.name}"</span>
          </div>
        )}

        {/* Walk List */}
        <div className="walk-list">
          {walks.length === 0 ? (
            <div className="walk-empty">
              <div className="walk-empty-icon">~</div>
              <div>No walks yet. Create one to get started!</div>
            </div>
          ) : (
            walks.map((walk) => (
              <div
                key={walk.id}
                className={`walk-item ${currentWalk?.id === walk.id ? 'selected' : ''}`}
                onClick={() => handleSelectWalk(walk)}
              >
                <div className="walk-item-header">
                  <span className="walk-item-name">{walk.name}</span>
                  <span className="walk-item-count">
                    {walk.steps.length} step{walk.steps.length !== 1 ? 's' : ''}
                  </span>
                  <div className="walk-item-actions">
                    <button
                      className="walk-item-action delete"
                      onClick={(e) => handleDeleteWalk(walk, e)}
                      title="Delete walk"
                    >
                      x
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Walk Detail */}
        {currentWalk && (
          <div className="walk-detail">
            <div className="walk-detail-header">
              <h3 className="walk-detail-title">{currentWalk.name}</h3>
              <div className="walk-detail-actions">
                <button
                  className={`walk-action-button ${isEditing ? 'editing' : ''}`}
                  onClick={handleToggleEdit}
                >
                  {isEditing ? 'Done' : 'Edit'}
                </button>
                <button
                  className="walk-action-button primary"
                  onClick={handleStartPresentation}
                  disabled={currentWalk.steps.length === 0}
                  title={currentWalk.steps.length === 0 ? 'Add steps first' : 'Start presentation'}
                >
                  Present
                </button>
              </div>
            </div>

            <div className="walk-steps-container">
              {currentWalk.steps.length === 0 ? (
                <div className="walk-steps-empty">
                  {isEditing
                    ? 'Click on nodes in the canvas to add them as steps'
                    : 'No steps yet. Click Edit to add nodes.'}
                </div>
              ) : (
                currentWalk.steps
                  .sort((a, b) => a.order - b.order)
                  .map((step, index) => (
                    <div key={step.id} className="walk-step-item">
                      <div className="walk-step-number">{index + 1}</div>
                      <div className="walk-step-info">
                        <div className="walk-step-title">
                          {getNodeTitle(step.nodeId)}
                        </div>
                        {step.annotation && (
                          <div className="walk-step-annotation">
                            {getStepAnnotationPreview(step)}
                          </div>
                        )}
                      </div>
                      <div className="walk-step-actions">
                        <button
                          className="walk-step-action"
                          onClick={(e) => handleEditStep(step, index, e)}
                          title="Edit annotation"
                        >
                          ...
                        </button>
                        <button
                          className="walk-step-action delete"
                          onClick={(e) => handleRemoveStep(step.id, e)}
                          title="Remove step"
                        >
                          x
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step Editor Modal */}
      {editingStep && (
        <WalkStepEditor
          step={editingStep.step}
          stepNumber={editingStep.index + 1}
          isOpen={true}
          onClose={handleCloseStepEditor}
        />
      )}
    </div>
  );
};

export default WalkPanel;
