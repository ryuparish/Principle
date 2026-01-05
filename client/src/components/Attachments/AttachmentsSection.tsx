import React, { useState, useRef } from 'react';
import { GoogleDriveConnect } from '../GoogleDrive/GoogleDriveConnect';
import { GoogleDrivePicker } from '../GoogleDrive/GoogleDrivePicker';
import { DriveFileCard } from '../GoogleDrive/DriveFileCard';
import { mediaApi } from '../../api/media.api';
import type { DriveAttachment, DriveFile } from '../../types/drive';
import type { Media } from '../../types';
import './AttachmentsSection.css';

interface AttachmentsSectionProps {
  // Image attachments
  images: Media[];
  onImageUpload: (file: File) => Promise<void>;
  onImageDelete: (mediaId: string) => void;
  onImageClick?: (media: Media, index: number) => void;
  uploadingImage: boolean;

  // Drive attachments
  driveAttachments: DriveAttachment[];
  onDriveFilesAdd: (files: DriveFile[]) => void;
  onDriveFileRemove: (attachmentId: string) => void;
}

export const AttachmentsSection: React.FC<AttachmentsSectionProps> = ({
  images,
  onImageUpload,
  onImageDelete,
  onImageClick,
  uploadingImage,
  driveAttachments,
  onDriveFilesAdd,
  onDriveFileRemove
}) => {
  const [driveConnected, setDriveConnected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onImageUpload(file);
      e.target.value = ''; // Reset input
    }
  };

  const handleDriveFilesSelected = (files: DriveFile[]) => {
    // Convert DriveFile to DriveAttachment
    const attachments: DriveAttachment[] = files.map(file => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      iconUrl: file.iconLink || '',
      thumbnailUrl: file.thumbnailLink,
      webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      size: file.size ? parseInt(file.size) : undefined,
      createdAt: file.createdTime || new Date().toISOString()
    }));
    onDriveFilesAdd(attachments as unknown as DriveFile[]);
  };

  const totalAttachments = images.length + driveAttachments.length;

  return (
    <div className="attachments-section">
      <div className="attachments-header">
        <span className="attachments-title">
          Attachments {totalAttachments > 0 && `(${totalAttachments})`}
        </span>
      </div>

      {/* Action buttons */}
      <div className="attachments-actions">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          className="upload-btn"
        >
          {uploadingImage ? 'Uploading...' : '📷 Upload Image'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {driveConnected ? (
          <GoogleDrivePicker
            onFilesSelected={handleDriveFilesSelected}
            buttonText="📁 Add from Drive"
          />
        ) : (
          <GoogleDriveConnect
            onStatusChange={setDriveConnected}
            compact
          />
        )}
      </div>

      {/* Images section */}
      {images.length > 0 && (
        <div>
          <p className="section-label">Images ({images.length})</p>
          <div className="images-grid">
            {images.map((media, index) => (
              <div
                key={media.id}
                className="image-thumb"
                onClick={() => onImageClick?.(media, index)}
              >
                <img
                  src={mediaApi.getThumbnailUrl(media)}
                  alt={media.originalName}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); onImageDelete(media.id); }}
                  className="image-delete-btn"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drive files section */}
      {driveAttachments.length > 0 && (
        <div>
          <p className="section-label">Drive Files ({driveAttachments.length})</p>
          <div className="drive-files-list">
            {driveAttachments.map((attachment) => (
              <DriveFileCard
                key={attachment.id}
                attachment={attachment}
                onRemove={() => onDriveFileRemove(attachment.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalAttachments === 0 && (
        <p className="empty-state">
          No attachments yet. Upload images or add files from Google Drive.
        </p>
      )}
    </div>
  );
};
