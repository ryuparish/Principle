import React from 'react';
import './ImportModal.css';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
  mapName: string;
  loading?: boolean;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  mapName,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="import-modal-overlay" onClick={onClose}>
      <div className="import-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="import-modal-header">
          <h2>Import Concept Map</h2>
          <button className="import-close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="import-modal-body">
          <div className="import-file-info">
            <div className="import-info-row">
              <span className="import-label">File:</span>
              <span className="import-value">{fileName}</span>
            </div>
            <div className="import-info-row">
              <span className="import-label">Map Name:</span>
              <span className="import-value">{mapName}</span>
            </div>
          </div>
          <div className="import-note">
            <p>
              This will create a new concept map with all nodes and edges from the file.
              The imported map will be named <strong>"{mapName} (Imported)"</strong> and
              will be set to private by default.
            </p>
          </div>
        </div>
        <div className="import-modal-footer">
          <button
            onClick={onClose}
            className="import-cancel-button"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="import-confirm-button"
            disabled={loading}
          >
            {loading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
};
