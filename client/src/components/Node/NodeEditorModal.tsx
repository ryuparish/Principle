import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ConceptMapNode, Media } from '../../types';
import { NodeShape } from '../../types/shapes';
import { useConceptMapStore } from "../../store/conceptMapStore";
import TipTapEditor from '../Editor/TipTapEditor';
import { ImageUploader } from '../ImageUploader/ImageUploader';
import { ImageGallery } from '../ImageGallery/ImageGallery';
import { ImageLightbox } from '../ImageLightbox/ImageLightbox';
import { TagInput } from '../Tags/TagInput';
import { ShapePicker } from './ShapePicker';
import './NodeEditorModal.css';

interface NodeEditorModalProps {
  node: ConceptMapNode;
  isOpen: boolean;
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

const NodeEditorModal: React.FC<NodeEditorModalProps> = ({
  node,
  isOpen,
  onClose
}) => {
  const { updateNode, loadNodeMedia, deleteMedia, uploadMedia } = useConceptMapStore();
  const nodeMedia = useConceptMapStore((state) => state.media[node.id] || []);

  const [title, setTitle] = useState(node.title);
  const [content, setContent] = useState(
    isValidTipTapContent(node.content)
      ? node.content
      : getDefaultContent()
  );
  const [tags, setTags] = useState<string[]>(node.tags || []);
  const [shape, setShape] = useState<NodeShape>((node.shape as NodeShape) || 'rounded-rectangle');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Refs to track latest values without causing re-renders
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const tagsRef = useRef(tags);
  const shapeRef = useRef(shape);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const updateNodeRef = useRef(updateNode);

  // Update refs when state changes
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    tagsRef.current = tags;
  }, [tags]);

  useEffect(() => {
    shapeRef.current = shape;
  }, [shape]);

  useEffect(() => {
    updateNodeRef.current = updateNode;
  }, [updateNode]);

  // Update local state when node prop changes
  useEffect(() => {
    setTitle(node.title);
    setContent(
      isValidTipTapContent(node.content)
        ? node.content
        : getDefaultContent()
    );
    setTags(node.tags || []);
    setShape((node.shape as NodeShape) || 'rounded-rectangle');
  }, [node]);

  // Load media when modal opens
  useEffect(() => {
    if (isOpen && node.id) {
      loadNodeMedia(node.id);
    }
  }, [isOpen, node.id, loadNodeMedia]);

  // Completely stable save function - no dependencies that change
  const performSaveRef = useRef(async (showMessage = true) => {
    // Skip if already saving
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      // Read from refs to get latest values
      await updateNodeRef.current(node.id, {
        title: titleRef.current,
        content: contentRef.current,
        shape: shapeRef.current
      });

      if (showMessage) {
        // Clear any existing message timeout
        if (saveMessageTimeoutRef.current) {
          clearTimeout(saveMessageTimeoutRef.current);
          saveMessageTimeoutRef.current = null;
        }

        // Only show message if not already showing to prevent bounce effect
        setSaveMessage((currentMessage) => {
          if (currentMessage === 'Saved') {
            // Already showing, just extend the timeout
            saveMessageTimeoutRef.current = setTimeout(() => {
              setSaveMessage(null);
              saveMessageTimeoutRef.current = null;
            }, 2000);
            return currentMessage;
          }

          // Show new message
          saveMessageTimeoutRef.current = setTimeout(() => {
            setSaveMessage(null);
            saveMessageTimeoutRef.current = null;
          }, 2000);
          return 'Saved';
        });
      }
    } catch (error) {
      console.error('Failed to save node:', error);

      // Clear any existing timeout
      if (saveMessageTimeoutRef.current) {
        clearTimeout(saveMessageTimeoutRef.current);
        saveMessageTimeoutRef.current = null;
      }

      setSaveMessage('Error saving');
      saveMessageTimeoutRef.current = setTimeout(() => {
        setSaveMessage(null);
        saveMessageTimeoutRef.current = null;
      }, 3000);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  });

  const performSave = useCallback((showMessage = true) => {
    return performSaveRef.current(showMessage);
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    await performSave();
  }, [isSaving, performSave]);

  const handleClose = useCallback(() => {
    handleSave();
    onClose();
  }, [handleSave, onClose]);

  const handleImageUpload = async (file: File) => {
    try {
      await uploadMedia(file, node.id);
      setSaveMessage('Image uploaded');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error: any) {
      console.error('Failed to upload image:', error);

      // Extract meaningful error message
      const errorData = error.response?.data;
      let errorMessage = 'Error uploading image';

      if (errorData?.code === 'SERVICE_UNAVAILABLE') {
        errorMessage = 'Media service offline - please restart services';
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSaveMessage(errorMessage);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const handleImageUploadError = (error: string) => {
    setSaveMessage(`Error: ${error}`);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleImageClick = (media: Media, index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleImageDelete = async (mediaId: string) => {
    await deleteMedia(mediaId, node.id);
    setSaveMessage('Image deleted');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  // Global Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // If lightbox is open, let it handle Escape instead
        if (lightboxOpen) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, lightboxOpen, handleClose]);

  // Auto-save after 1 second of inactivity
  useEffect(() => {
    // Clear any existing save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new save timeout
    saveTimeoutRef.current = setTimeout(() => {
      performSave();
      saveTimeoutRef.current = null;
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [title, content, shape, performSave]);

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <input
              type="text"
              className="node-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Node Title"
              autoFocus
            />
            <div className="modal-actions">
              <button className="close-button" onClick={handleClose}>
                ✕
              </button>
            </div>
          </div>

          <div className="modal-body">
            <TipTapEditor
              content={content}
              onChange={setContent}
              placeholder="Write your notes here..."
            />

            <div className="metadata-row">
              <div className="tags-section">
                <label className="tags-label">Tags:</label>
                <TagInput
                  nodeId={node.id}
                  currentTags={tags}
                  onTagsChange={setTags}
                  placeholder="Add tags..."
                />
              </div>

              <div className="shape-section">
                <label className="shape-label">Shape:</label>
                <ShapePicker
                  currentShape={shape}
                  onShapeSelect={setShape}
                />
              </div>

              <div className="images-section">
                <span className="images-label">Images:</span>
                <ImageUploader
                  nodeId={node.id}
                  onUploadSuccess={handleImageUpload}
                  onUploadError={handleImageUploadError}
                />
                {nodeMedia.length > 0 && (
                  <ImageGallery
                    media={nodeMedia}
                    onImageClick={handleImageClick}
                    onImageDelete={handleImageDelete}
                    showDelete={true}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <div className="footer-info">
              <span className="node-id">ID: {node.id}</span>
              <span className="last-updated">
                Updated: {new Date(node.updatedAt).toLocaleString()}
              </span>
            </div>
            <button className="save-close-button" onClick={handleClose}>
              Save & Close
            </button>
          </div>
        </div>
      </div>

      <ImageLightbox
        media={nodeMedia}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default NodeEditorModal;
