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
                className="delete-badge"
                onClick={(e) => handleDelete(e, item.id)}
                disabled={deletingId === item.id}
                title="Delete image"
              >
                {deletingId === item.id ? '...' : '×'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
