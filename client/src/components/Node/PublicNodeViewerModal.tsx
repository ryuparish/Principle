import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ConceptMapNode, Media } from '../../types';
import { SHAPE_CONFIGS } from '../../types/shapes';
import TipTapEditor from '../Editor/TipTapEditor';
import { ImageGallery } from '../ImageGallery/ImageGallery';
import { ImageLightbox } from '../ImageLightbox/ImageLightbox';
import { TagChip } from '../Tags/TagChip';
import { mediaApi } from '../../api/media.api';
import './NodeEditorModal.css';  // Reuse existing styles

interface PublicNodeViewerModalProps {
  node: ConceptMapNode | null;  // null when closed
  onClose: () => void;
}

// Helper function to validate TipTap content structure
const isValidTipTapContent = (content: any): boolean => {
  return content &&
         typeof content === 'object' &&
         content.type === 'doc' &&
         Array.isArray(content.content);
};

// Default empty TipTap document
const getDefaultContent = () => ({
  type: 'doc',
  content: []
});

const PublicNodeViewerModal: React.FC<PublicNodeViewerModalProps> = ({ node, onClose }) => {
  const [media, setMedia] = useState<Media[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  // Load media for node
  useEffect(() => {
    if (!node?.imageIds || node.imageIds.length === 0) {
      setMedia([]);
      return;
    }

    const loadMedia = async () => {
      setIsLoadingMedia(true);
      try {
        const mediaData = await mediaApi.getByIds(node.imageIds);
        setMedia(mediaData);
      } catch (error) {
        console.error('Failed to load media:', error);
        setMedia([]);
      } finally {
        setIsLoadingMedia(false);
      }
    };

    loadMedia();
  }, [node?.imageIds]);

  // Keyboard handler for ESC
  useEffect(() => {
    if (!node) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't close if lightbox is open
      if (lightboxIndex !== null) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [node, lightboxIndex, onClose]);

  const handleImageClick = (_clickedMedia: Media, index: number) => {
    setLightboxIndex(index);
  };

  if (!node) return null;

  const content = isValidTipTapContent(node.content)
    ? node.content
    : getDefaultContent();

  const hasContent = content.content && content.content.length > 0;
  const shapeName = SHAPE_CONFIGS[node.shape as keyof typeof SHAPE_CONFIGS]?.name || node.shape || 'Rounded Rectangle';

  const modalContent = (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content public-node-viewer" onClick={(e) => e.stopPropagation()}>
          {/* Header with title as heading (not input) */}
          <div className="modal-header">
            <h2 style={{
              flex: 1,
              fontSize: '24px',
              fontWeight: 600,
              margin: 0,
              padding: '8px 12px',
              color: '#1a1a1a'
            }}>
              {node.title}
            </h2>
            <button className="close-button" onClick={onClose} title="Close (Esc)">
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {/* Read-only TipTap Editor */}
            {hasContent ? (
              <TipTapEditor
                content={content}
                editable={false}
                hideMenuBar={true}
                placeholder=""
              />
            ) : (
              <p style={{
                color: '#9ca3af',
                fontStyle: 'italic',
                padding: '16px',
                textAlign: 'center'
              }}>
                This node has no content.
              </p>
            )}

            {/* Metadata Section */}
            <div className="metadata-row">
              {/* Tags */}
              {node.tags && node.tags.length > 0 && (
                <div className="tags-section">
                  <label className="tags-label">Tags:</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {node.tags.map((tag, index) => (
                      <TagChip
                        key={`${tag}-${index}`}
                        tagName={tag}
                        size="sm"
                        onClick={() => {}} // No-op in public viewer
                        interactive={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Shape */}
              <div className="shape-section">
                <label className="shape-label">Shape:</label>
                <span style={{ fontSize: '14px', color: '#4a4a4a' }}>{shapeName}</span>
              </div>
            </div>

            {/* Images */}
            {node.imageIds && node.imageIds.length > 0 && (
              <div className="images-section" style={{ marginTop: '16px', width: '100%' }}>
                <label className="images-label">Images:</label>
                {isLoadingMedia ? (
                  <span style={{ fontSize: '14px', color: '#666' }}>Loading images...</span>
                ) : media.length > 0 ? (
                  <ImageGallery
                    media={media}
                    onImageClick={handleImageClick}
                    showDelete={false}  // Read-only, no delete button
                  />
                ) : (
                  <span style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic' }}>
                    No images attached
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <div className="footer-info">
              <div className="node-id">ID: {node.id}</div>
              <div className="last-updated">
                Last updated: {new Date(node.updatedAt).toLocaleString()}
              </div>
            </div>
            <button
              className="save-close-button"
              onClick={onClose}
              style={{ background: '#6b7280' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#4b5563'}
              onMouseOut={(e) => e.currentTarget.style.background = '#6b7280'}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          media={media}
          initialIndex={lightboxIndex}
          isOpen={true}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default PublicNodeViewerModal;
