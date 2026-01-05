import React from 'react';
import type { DriveAttachment } from '../../types/drive';

interface DriveFileCardProps {
  attachment: DriveAttachment;
  onRemove?: () => void;
  compact?: boolean;
}

// Map mime types to friendly names
const getMimeTypeLabel = (mimeType: string): string => {
  const mimeMap: Record<string, string> = {
    'application/vnd.google-apps.document': 'Doc',
    'application/vnd.google-apps.spreadsheet': 'Sheet',
    'application/vnd.google-apps.presentation': 'Slides',
    'application/vnd.google-apps.form': 'Form',
    'application/vnd.google-apps.drawing': 'Drawing',
    'application/vnd.google-apps.folder': 'Folder',
    'application/pdf': 'PDF',
    'image/png': 'PNG',
    'image/jpeg': 'JPEG',
    'image/gif': 'GIF',
    'video/mp4': 'Video',
    'audio/mpeg': 'Audio',
    'text/plain': 'Text',
    'application/zip': 'ZIP',
  };
  return mimeMap[mimeType] || 'File';
};

// Get icon based on mime type
const getMimeTypeIcon = (mimeType: string): string => {
  if (mimeType.includes('folder')) return '\uD83D\uDCC1';
  if (mimeType.includes('document')) return '\uD83D\uDCC4';
  if (mimeType.includes('spreadsheet')) return '\uD83D\uDCCA';
  if (mimeType.includes('presentation')) return '\uD83D\uDCFD';
  if (mimeType.includes('form')) return '\uD83D\uDCCB';
  if (mimeType.includes('image')) return '\uD83D\uDDBC';
  if (mimeType.includes('video')) return '\uD83C\uDFA5';
  if (mimeType.includes('audio')) return '\uD83C\uDFB5';
  if (mimeType.includes('pdf')) return '\uD83D\uDCC4';
  return '\uD83D\uDCC4';
};

export const DriveFileCard: React.FC<DriveFileCardProps> = ({
  attachment,
  onRemove,
  compact = false
}) => {
  const handleClick = () => {
    window.open(attachment.webViewLink, '_blank');
  };

  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200 cursor-pointer group"
        onClick={handleClick}
        title={attachment.name}
      >
        {attachment.iconUrl ? (
          <img src={attachment.iconUrl} alt="" className="w-4 h-4" />
        ) : (
          <span>{getMimeTypeIcon(attachment.mimeType)}</span>
        )}
        <span className="truncate max-w-[100px]">{attachment.name}</span>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 ml-1"
          >
            x
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm cursor-pointer group transition-all"
      onClick={handleClick}
    >
      {attachment.iconUrl ? (
        <img src={attachment.iconUrl} alt="" className="w-8 h-8" />
      ) : (
        <span className="text-2xl">{getMimeTypeIcon(attachment.mimeType)}</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {attachment.name}
        </p>
        <p className="text-xs text-gray-500">
          {getMimeTypeLabel(attachment.mimeType)}
          {attachment.size && ` - ${formatBytes(attachment.size)}`}
        </p>
      </div>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
          title="Remove"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
