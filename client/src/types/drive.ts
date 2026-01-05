export interface DriveAttachment {
  id: string;           // Google Drive file ID
  name: string;         // File name
  mimeType: string;     // e.g., "application/vnd.google-apps.document"
  iconUrl: string;      // Google's file type icon
  thumbnailUrl?: string;
  webViewLink: string;  // Link to open in Drive
  size?: number;
  createdAt: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
}

export interface DriveFilesResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

export interface DriveAuthStatus {
  connected: boolean;
  email?: string;
}
