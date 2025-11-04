import React, { useState } from 'react';
import { Media } from '../../types';
import { mediaApi } from '../../api/media.api';
import './ImageGallery.css';

interface ImageGalleryProps {
  media: Media[];
  onImageClick: (media: Media, index: number) => void;
  onImageDelete?: (mediaId: string) => void;
  showDelete?: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  media,
  onImageClick,
  onImageDelete,
  showDelete = false
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, mediaId: string) => {
    e.stopPropagation();
    if (!onImageDelete) return;

    setDeletingId(mediaId);
    try {
      // Let the parent handle the actual deletion
      await onImageDelete(mediaId);
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Failed to delete image');
    } finally {
      setDeletingId(null);
    }
  };

  if (media.length === 0) {
    return (
      <div className="image-gallery-empty">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p>No images yet</p>
      </div>
    );
  }

  return (
    <div className="image-gallery">
      {media.map((item, index) => (
        <div
          key={item.id}
          className={`gallery-item ${deletingId === item.id ? 'deleting' : ''}`}
          onClick={() => onImageClick(item, index)}
        >
          <img
            src={mediaApi.getThumbnailUrl(item)}
            alt={item.originalName}
            className="gallery-thumbnail"
            loading="lazy"
          />
          <div className="gallery-overlay">
            <div className="gallery-info">
              <span className="gallery-filename">{item.originalName}</span>
              <span className="gallery-dimensions">
                {item.width} × {item.height}
              </span>
            </div>
            {showDelete && onImageDelete && (
              <button
                className="delete-button"
                onClick={(e) => handleDelete(e, item.id)}
                disabled={deletingId === item.id}
                title="Delete image"
              >
                {deletingId === item.id ? (
                  <span className="delete-spinner" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
