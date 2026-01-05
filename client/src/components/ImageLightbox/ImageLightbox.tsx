import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { Media } from '../../types';
import { mediaApi } from '../../api/media.api';
import './ImageLightbox.css';

interface ImageLightboxProps {
  media: Media[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

// Set app element for accessibility
if (typeof document !== 'undefined') {
  Modal.setAppElement('#root');
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  media,
  initialIndex,
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    setIsLoading(true);
  }, [currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, media.length]);

  if (media.length === 0) return null;

  const currentMedia = media[currentIndex];

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="lightbox-modal"
      overlayClassName="lightbox-overlay"
      closeTimeoutMS={200}
    >
      <div className="lightbox-content">
        {/* Close button */}
        <button className="lightbox-close" onClick={onClose} title="Close (Esc)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Navigation buttons */}
        {media.length > 1 && (
          <>
            <button
              className="lightbox-nav prev"
              onClick={handlePrevious}
              title="Previous (←)"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button className="lightbox-nav next" onClick={handleNext} title="Next (→)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* Image container */}
        <div className="lightbox-image-container lightbox-scrollable">
          {isLoading && (
            <div className="lightbox-loader">
              <div className="spinner" />
            </div>
          )}
          <img
            src={mediaApi.getImageUrl(currentMedia)}
            alt={currentMedia.originalName}
            className={`lightbox-image ${isLoading ? 'loading' : ''}`}
            onLoad={() => setIsLoading(false)}
          />
        </div>

        {/* Image info */}
        <div className="lightbox-info">
          <div className="lightbox-info-left">
            <span className="lightbox-filename">{currentMedia.originalName}</span>
            <span className="lightbox-dimensions">
              {currentMedia.width} × {currentMedia.height} • {Math.round(currentMedia.sizeBytes / 1024)} KB
            </span>
          </div>
          {media.length > 1 && (
            <div className="lightbox-counter">
              {currentIndex + 1} / {media.length}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
