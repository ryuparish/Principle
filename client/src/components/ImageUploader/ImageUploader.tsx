import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Media } from '../../types';
import { mediaApi } from '../../api/media.api';
import './ImageUploader.css';

interface ImageUploaderProps {
  nodeId?: string;
  onUploadSuccess: (file: File) => void;
  onUploadError?: (error: string) => void;
  maxSize?: number; // in bytes, default 10MB
  accept?: string[];
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  nodeId,
  onUploadSuccess,
  onUploadError,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);
      setProgress(0);

      try {
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        // Let the parent handle the upload
        await onUploadSuccess(file);

        clearInterval(progressInterval);
        setProgress(100);

        setTimeout(() => {
          setUploading(false);
          setProgress(0);
        }, 500);
      } catch (error: any) {
        setUploading(false);
        setProgress(0);
        const errorMessage = error.response?.data?.error || 'Failed to upload image';
        onUploadError?.(errorMessage);
        console.error('Upload error:', error);
      }
    },
    [onUploadSuccess, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } =
    useDropzone({
      onDrop,
      accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
      maxSize,
      maxFiles: 1,
      disabled: uploading
    });

  const errors = fileRejections[0]?.errors;

  return (
    <div className="image-uploader">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${
          isDragReject ? 'reject' : ''
        } ${uploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="upload-progress">
            <div className="spinner" />
          </div>
        ) : (
          <div className="dropzone-content">
            {(isDragActive || isDragReject) ? (
              <span className="dropzone-icon">{isDragReject ? '✗' : '✓'}</span>
            ) : (
              <svg
                className="upload-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                title="Click or drag to upload image"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
          </div>
        )}
      </div>

      {errors && errors.length > 0 && (
        <div className="upload-errors">
          {errors.map((error) => (
            <p key={error.code} className="error-message">
              {error.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
