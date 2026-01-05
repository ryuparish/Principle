import React, { useEffect, useCallback, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { useWalkStore } from '../../store/walkStore';
import { useConceptMapStore } from '../../store/conceptMapStore';
import './WalkPresentation.css';

interface WalkPresentationProps {
  onClose?: () => void;
}

export const WalkPresentation: React.FC<WalkPresentationProps> = ({ onClose }) => {
  const {
    currentWalk,
    isPresenting,
    currentStepIndex,
    nextStep,
    prevStep,
    goToStep,
    stopPresentation
  } = useWalkStore();

  const { nodes } = useConceptMapStore();
  const { setCenter, getNode } = useReactFlow();
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));

  // Get current step
  const currentStep = currentWalk?.steps[currentStepIndex];
  const totalSteps = currentWalk?.steps.length || 0;

  // Get node info for current step
  const currentNode = currentStep
    ? nodes.find((n) => n.id === currentStep.nodeId)
    : null;

  // Animate to current step
  const animateToStep = useCallback(() => {
    if (!currentStep || !currentNode) return;

    // Get React Flow node for accurate dimensions
    const reactFlowNode = getNode(currentStep.nodeId);
    const nodeWidth = reactFlowNode?.width || 150;
    const nodeHeight = reactFlowNode?.height || 60;

    // Calculate center of node
    const centerX = currentNode.position.x + nodeWidth / 2;
    const centerY = currentNode.position.y + nodeHeight / 2;

    // Animate to center with Prezi-style smooth transition
    setCenter(centerX, centerY, {
      zoom: currentStep.zoomLevel || 1.5,
      duration: 800
    });

    // Track visited steps
    setVisitedSteps((prev) => new Set([...prev, currentStepIndex]));
  }, [currentStep, currentNode, currentStepIndex, getNode, setCenter]);

  // Animate when step changes
  useEffect(() => {
    if (isPresenting && currentStep) {
      animateToStep();
    }
  }, [isPresenting, currentStepIndex, animateToStep]);

  // Auto-advance timer
  useEffect(() => {
    if (!isPresenting || !currentStep) return;

    // Check if current step has auto-advance duration set
    const duration = currentStep.duration;
    if (!duration || duration <= 0) return;

    // Don't auto-advance on the last step
    if (currentStepIndex >= totalSteps - 1) return;

    console.log(`[Walk] Auto-advance in ${duration}ms`);

    // Set timeout to advance to next step
    const timerId = setTimeout(() => {
      console.log('[Walk] Auto-advancing to next step');
      nextStep();
    }, duration);

    // Cleanup on unmount or when step changes
    return () => {
      clearTimeout(timerId);
    };
  }, [isPresenting, currentStep, currentStepIndex, totalSteps, nextStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isPresenting) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'l':
        case 'j':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
        case 'h':
        case 'k':
          e.preventDefault();
          prevStep();
          break;
        case 'Escape':
        case 'q':
          e.preventDefault();
          handleClose();
          break;
        case 'Home':
          e.preventDefault();
          goToStep(0);
          break;
        case 'End':
          e.preventDefault();
          goToStep(totalSteps - 1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, nextStep, prevStep, goToStep, totalSteps]);

  const handleClose = useCallback(() => {
    stopPresentation();
    setVisitedSteps(new Set([0]));
    onClose?.();
  }, [stopPresentation, onClose]);

  const handlePrev = useCallback(() => {
    prevStep();
  }, [prevStep]);

  const handleNext = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const handleDotClick = useCallback(
    (index: number) => {
      goToStep(index);
    },
    [goToStep]
  );

  // Parse annotation text (strip HTML for simple display)
  const getAnnotationText = (annotation: string | null | undefined): string => {
    if (!annotation) return '';
    // Simple HTML strip - could be enhanced to render rich text
    return annotation.replace(/<[^>]*>/g, '').trim();
  };

  if (!isPresenting || !currentWalk || !currentStep) {
    return null;
  }

  const annotationText = getAnnotationText(currentStep.annotation);

  return (
    <div className="walk-presentation">
      {/* Top Controls Bar */}
      <div className="walk-presentation-controls">
        <div className="walk-presentation-title">{currentWalk.name}</div>
        <button
          className="walk-presentation-close"
          onClick={handleClose}
          title="Exit presentation (Esc)"
        >
          ✕
        </button>
      </div>

      {/* Left Navigation */}
      <div className="walk-presentation-nav prev">
        <button
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
          title="Previous step (← or h)"
        >
          ←
        </button>
      </div>

      {/* Right Navigation */}
      <div className="walk-presentation-nav next">
        <button
          onClick={handleNext}
          disabled={currentStepIndex === totalSteps - 1}
          title="Next step (→ or l)"
        >
          →
        </button>
      </div>

      {/* Bottom Annotation Panel */}
      <div className="walk-presentation-annotation">
        <div className="walk-presentation-step-info">
          <div className="walk-presentation-step-number">
            {currentStepIndex + 1}
          </div>
          <div className="walk-presentation-step-title">
            {currentNode?.title || 'Unknown Node'}
          </div>
          <div className="walk-presentation-step-of">
            of {totalSteps}
          </div>
        </div>

        {annotationText ? (
          <div className="walk-presentation-annotation-text">
            <p>{annotationText}</p>
          </div>
        ) : (
          <div className="walk-presentation-no-annotation">
            No annotation for this step
          </div>
        )}

        {/* Progress Dots */}
        <div className="walk-presentation-progress">
          {currentWalk.steps.map((_, index) => (
            <button
              key={index}
              className={`walk-presentation-dot ${
                index === currentStepIndex ? 'active' : ''
              } ${visitedSteps.has(index) ? 'visited' : ''}`}
              onClick={() => handleDotClick(index)}
              title={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Keyboard Hints */}
      <div className="walk-presentation-hints">
        <span className="walk-presentation-hint">
          <kbd>←</kbd> / <kbd>→</kbd> Navigate
        </span>
        <span className="walk-presentation-hint">
          <kbd>Esc</kbd> Exit
        </span>
      </div>
    </div>
  );
};

export default WalkPresentation;
