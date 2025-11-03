export interface Media {
  id: string;
  nodeId?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  url: string;
  thumbnailUrl?: string;
  createdAt: Date;
}

export interface MediaUploadInput {
  nodeId?: string;
  file: File | Buffer;
  originalName: string;
  mimeType: string;
}
