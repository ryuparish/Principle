# Phase 4: Media/Images Implementation Guide
# Principle - Interactive World Mindmap Application

**Phase:** 4 - Media/Images
**Timeline:** Week 4 (5-7 days)
**Status:** Ready for Implementation
**Date Created:** November 3, 2025

---

## Overview

Phase 4 adds rich media capabilities to Principle nodes, allowing users to upload, store, and display images within their mindmaps. By the end of Phase 4, users will be able to drag-drop images into nodes, see thumbnails in node cards, and view full-size images with a lightbox.

**What You'll Build:**
- Complete Media Service with image upload, storage, and serving
- Automatic thumbnail generation using Sharp
- File validation (type, size, dimensions)
- Drag-drop image upload UI in node editor
- Image display with thumbnails in node cards
- Image lightbox for full-size viewing
- Integration with Node Service (imageIds tracking)
- Local file storage in `./uploads/` directory

**Key Features:**
- Upload images (PNG, JPG, GIF, WebP) up to 10MB
- Drag-drop interface for easy uploads
- Automatic thumbnail generation (200x200px)
- Multiple images per node
- Image reordering within nodes
- Image deletion with cleanup
- All data persists locally

**Tech Stack:**
- **Multer**: File upload middleware
- **Sharp**: Image processing and thumbnail generation
- **Prisma**: ORM for media metadata
- **PostgreSQL**: Media database (principle_media_db)
- **React Dropzone**: Drag-drop interface
- **React Modal**: Image lightbox component

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Changes](#architecture-changes)
3. [Media Service Implementation](#media-service-implementation)
4. [API Gateway Media Routes](#api-gateway-media-routes)
5. [Client Image Upload UI](#client-image-upload-ui)
6. [Node Integration](#node-integration)
7. [Testing the Complete Flow](#testing-the-complete-flow)
8. [Success Criteria](#success-criteria)
9. [Troubleshooting](#troubleshooting)
10. [Performance Considerations](#performance-considerations)

---

## Prerequisites

### Phases 0-3 Must Be Complete

Before starting Phase 4, verify:

1. ✅ **Phase 0**: All services running, databases accessible
2. ✅ **Phase 1**: Mindmaps and nodes working with persistence
3. ✅ **Phase 2**: Node editor with rich text editing
4. ✅ **Phase 3**: Edges connecting nodes, context menus

### Verify Services Are Running

```bash
# Check all services are accessible
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Node Service
curl http://localhost:3002/health  # Edge Service
curl http://localhost:3003/health  # Media Service
curl http://localhost:5173         # Client
```

### Database Check

```bash
# Verify media database exists
docker-compose ps | grep postgres-media

# Should show: postgres-media running
```

---

## Architecture Changes

### Database Schema

The Media Service will use the following Prisma schema:

**File**: `media-service/prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Media {
  id           String   @id @default(uuid())
  nodeId       String?  // Optional - image may not be attached yet
  filename     String   @unique
  originalName String
  mimeType     String
  sizeBytes    Int
  width        Int?
  height       Int?
  url          String
  thumbnailUrl String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([nodeId])
  @@index([filename])
  @@map("media")
}
```

**Field Descriptions:**
- `id`: Unique UUID for each media file
- `nodeId`: Foreign key to node (null if orphaned)
- `filename`: Generated unique filename on disk
- `originalName`: Original filename from upload
- `mimeType`: MIME type (e.g., "image/png")
- `sizeBytes`: File size in bytes
- `width/height`: Image dimensions (populated after upload)
- `url`: Public URL to access full image
- `thumbnailUrl`: Public URL to access thumbnail
- `createdAt/updatedAt`: Timestamps

### Component Architecture

```
MindMapCanvas
├── CustomNode (updated)
│   ├── Node content
│   └── Image thumbnails (new)
├── NodeEditor (updated)
│   ├── Rich text editor
│   ├── ImageUploader (new)
│   └── ImageGallery (new)
└── ImageLightbox (new)
```

### Service Architecture

```
Client (React)
    ↓ HTTP (multipart/form-data)
API Gateway (:3000)
    ↓ Proxy with FormData
Media Service (:3003)
    ↓ Multer (parse file)
    ↓ Sharp (resize & thumbnail)
    ↓ fs (save to ./uploads/)
    ↓ Prisma (save metadata)
PostgreSQL (principle_media_db)
```

### File Storage Structure

```
media-service/
└── uploads/
    ├── abc123-original.jpg          (full size)
    ├── abc123-thumb.jpg              (thumbnail 200x200)
    ├── def456-original.png
    └── def456-thumb.png
```

---

## Media Service Implementation

### Step 1: Create Prisma Schema

```bash
cd media-service

# Create or update schema
cat > prisma/schema.prisma << 'EOF'
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Media {
  id           String   @id @default(uuid())
  nodeId       String?
  filename     String   @unique
  originalName String
  mimeType     String
  sizeBytes    Int
  width        Int?
  height       Int?
  url          String
  thumbnailUrl String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([nodeId])
  @@index([filename])
  @@map("media")
}
EOF

# Generate Prisma client
npx prisma generate

# Run migration
npx prisma migrate dev --name add_media_table
```

### Step 2: Install Dependencies

```bash
cd media-service

npm install multer sharp uuid
npm install --save-dev @types/multer
```

### Step 3: Create Upload Directory

```bash
cd media-service
mkdir -p uploads
```

### Step 4: Create Multer Configuration

**File**: `media-service/src/middleware/multer.config.ts`

```typescript
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// File filter - only images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}-original${ext}`);
  }
});

// Multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});
```

### Step 5: Create Storage Service

**File**: `media-service/src/services/storage.service.ts`

```typescript
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export class StorageService {
  private uploadsDir = path.join(__dirname, '../../uploads');

  /**
   * Generate thumbnail from uploaded image
   */
  async generateThumbnail(filename: string): Promise<string> {
    const originalPath = path.join(this.uploadsDir, filename);
    const thumbnailFilename = filename.replace('-original', '-thumb');
    const thumbnailPath = path.join(this.uploadsDir, thumbnailFilename);

    await sharp(originalPath)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(thumbnailPath);

    return thumbnailFilename;
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(filename: string): Promise<{ width: number; height: number }> {
    const filePath = path.join(this.uploadsDir, filename);
    const metadata = await sharp(filePath).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  }

  /**
   * Delete file from disk
   */
  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.uploadsDir, filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file ${filename}:`, error);
    }
  }

  /**
   * Delete both original and thumbnail
   */
  async deleteImageAndThumbnail(originalFilename: string): Promise<void> {
    const thumbnailFilename = originalFilename.replace('-original', '-thumb');
    await this.deleteFile(originalFilename);
    await this.deleteFile(thumbnailFilename);
  }
}

export const storageService = new StorageService();
```

### Step 6: Create Media Service Layer

**File**: `media-service/src/services/media.service.ts`

```typescript
import { PrismaClient, Media } from '@prisma/client';
import { storageService } from './storage.service';

const prisma = new PrismaClient();

export interface CreateMediaInput {
  nodeId?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export class MediaService {
  async createMedia(data: CreateMediaInput): Promise<Media> {
    // Get image dimensions
    const dimensions = await storageService.getImageDimensions(data.filename);

    // Generate thumbnail
    const thumbnailFilename = await storageService.generateThumbnail(data.filename);

    // Create database record
    const media = await prisma.media.create({
      data: {
        nodeId: data.nodeId,
        filename: data.filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        width: dimensions.width,
        height: dimensions.height,
        url: `/media/${data.filename}`,
        thumbnailUrl: `/media/${thumbnailFilename}`
      }
    });

    return media;
  }

  async getMediaById(id: string): Promise<Media | null> {
    return prisma.media.findUnique({
      where: { id }
    });
  }

  async getMediaByNode(nodeId: string): Promise<Media[]> {
    return prisma.media.findMany({
      where: { nodeId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getMediaByIds(ids: string[]): Promise<Media[]> {
    return prisma.media.findMany({
      where: {
        id: { in: ids }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async updateMedia(id: string, data: { nodeId?: string }): Promise<Media> {
    return prisma.media.update({
      where: { id },
      data
    });
  }

  async deleteMedia(id: string): Promise<void> {
    const media = await prisma.media.findUnique({
      where: { id }
    });

    if (!media) {
      throw new Error('Media not found');
    }

    // Delete from database
    await prisma.media.delete({
      where: { id }
    });

    // Delete files from disk
    await storageService.deleteImageAndThumbnail(media.filename);
  }

  async cleanupOrphanedMedia(): Promise<number> {
    // Find media not attached to any node and older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const orphaned = await prisma.media.findMany({
      where: {
        nodeId: null,
        createdAt: { lt: oneDayAgo }
      }
    });

    // Delete each orphaned media
    for (const media of orphaned) {
      await this.deleteMedia(media.id);
    }

    return orphaned.length;
  }
}

export const mediaService = new MediaService();
```

### Step 7: Create Media Controller

**File**: `media-service/src/controllers/media.controller.ts`

```typescript
import { Request, Response } from 'express';
import path from 'path';
import { mediaService } from '../services/media.service';

export class MediaController {
  async upload(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { nodeId } = req.body;

      const media = await mediaService.createMedia({
        nodeId: nodeId || null,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size
      });

      res.status(201).json(media);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: error.message || 'Failed to upload file' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const media = await mediaService.getMediaById(id);

      if (!media) {
        return res.status(404).json({ error: 'Media not found' });
      }

      res.json(media);
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ error: 'Failed to fetch media' });
    }
  }

  async getByNode(req: Request, res: Response) {
    try {
      const { nodeId } = req.query;

      if (!nodeId || typeof nodeId !== 'string') {
        return res.status(400).json({ error: 'nodeId query parameter is required' });
      }

      const media = await mediaService.getMediaByNode(nodeId);
      res.json({ media });
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ error: 'Failed to fetch media' });
    }
  }

  async getByIds(req: Request, res: Response) {
    try {
      const { ids } = req.query;

      if (!ids || typeof ids !== 'string') {
        return res.status(400).json({ error: 'ids query parameter is required' });
      }

      const idArray = ids.split(',');
      const media = await mediaService.getMediaByIds(idArray);
      res.json({ media });
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ error: 'Failed to fetch media' });
    }
  }

  async serveFile(req: Request, res: Response) {
    try {
      const { filename } = req.params;
      const filePath = path.join(__dirname, '../../uploads', filename);

      res.sendFile(filePath);
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).json({ error: 'Failed to serve file' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await mediaService.deleteMedia(id);
      res.json({ success: true, message: 'Media deleted' });
    } catch (error: any) {
      if (error.message === 'Media not found') {
        return res.status(404).json({ error: 'Media not found' });
      }
      console.error('Error deleting media:', error);
      res.status(500).json({ error: 'Failed to delete media' });
    }
  }

  async cleanup(req: Request, res: Response) {
    try {
      const count = await mediaService.cleanupOrphanedMedia();
      res.json({ success: true, deletedCount: count });
    } catch (error) {
      console.error('Error cleaning up media:', error);
      res.status(500).json({ error: 'Failed to cleanup media' });
    }
  }
}

export const mediaController = new MediaController();
```

### Step 8: Create Media Routes

**File**: `media-service/src/routes/media.routes.ts`

```typescript
import { Router } from 'express';
import { mediaController } from '../controllers/media.controller';
import { upload } from '../middleware/multer.config';

const router = Router();

// Upload image
router.post('/upload', upload.single('image'), (req, res) =>
  mediaController.upload(req, res)
);

// Get media by ID
router.get('/:id', (req, res) => mediaController.getById(req, res));

// Serve file
router.get('/file/:filename', (req, res) => mediaController.serveFile(req, res));

// Get media by node
router.get('/node/:nodeId', (req, res) => mediaController.getByNode(req, res));

// Get media by IDs (bulk)
router.get('/bulk', (req, res) => mediaController.getByIds(req, res));

// Delete media
router.delete('/:id', (req, res) => mediaController.delete(req, res));

// Cleanup orphaned media
router.post('/cleanup', (req, res) => mediaController.cleanup(req, res));

export default router;
```

### Step 9: Update Media Service Index

**File**: `media-service/src/index.ts`

```typescript
import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { prisma } from './lib/prisma';
import mediaRoutes from './routes/media.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files from uploads directory
app.use('/media', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'media-service',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Principle Media Service',
    version: '1.0.0',
    endpoints: {
      upload: 'POST /upload',
      getMedia: 'GET /:id',
      serveFile: 'GET /file/:filename',
      delete: 'DELETE /:id'
    }
  });
});

// API Routes
app.use('/', mediaRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Media Service running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

### Step 10: Build and Test Media Service

```bash
cd media-service

# Build TypeScript
npm run build

# Restart service
PORT=3003 npm start
```

Test the upload endpoint:

```bash
# Test upload (replace with actual image file)
curl -X POST http://localhost:3003/upload \
  -F "image=@test-image.jpg" \
  -F "nodeId=test-node-id"

# Should return media object with URLs

# Test file serving
curl http://localhost:3003/media/abc123-original.jpg -o downloaded.jpg

# Should download the image
```

---

## API Gateway Media Routes

### Step 1: Create Media Routes in Gateway

**File**: `api-gateway/src/routes/media.routes.ts`

```typescript
import { Router, Request, Response } from 'express';
import axios from 'axios';
import FormData from 'form-data';
import multer from 'multer';
import { services } from '../config/services.config';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload image
router.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Forward file to media service
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    if (req.body.nodeId) {
      formData.append('nodeId', req.body.nodeId);
    }

    const response = await axios.post(`${services.mediaService}/upload`, formData, {
      headers: formData.getHeaders()
    });

    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('Error uploading file:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to upload file'
    });
  }
});

// Get media by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${services.mediaService}/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching media:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch media'
    });
  }
});

// Serve file (proxy to media service)
router.get('/file/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const response = await axios.get(`${services.mediaService}/file/${filename}`, {
      responseType: 'stream'
    });
    response.data.pipe(res);
  } catch (error: any) {
    console.error('Error serving file:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to serve file'
    });
  }
});

// Get media by node
router.get('/node/:nodeId', async (req: Request, res: Response) => {
  try {
    const { nodeId } = req.params;
    const response = await axios.get(`${services.mediaService}/node/${nodeId}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching media:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch media'
    });
  }
});

// Delete media
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.delete(`${services.mediaService}/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error deleting media:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to delete media'
    });
  }
});

export default router;
```

### Step 2: Update API Gateway Index

Add to imports in `api-gateway/src/index.ts`:

```typescript
import mediaRoutes from './routes/media.routes';
```

Add route registration:

```typescript
// API Routes
app.use('/api/mindmaps', mindmapRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/edges', edgeRoutes);
app.use('/api/media', mediaRoutes); // Add this
```

Update root endpoint to list media routes:

```typescript
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Principle API Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      mindmaps: '/api/mindmaps',
      nodes: '/api/nodes',
      edges: '/api/edges',
      media: '/api/media'  // Add this
    }
  });
});
```

### Step 3: Install FormData Dependency

```bash
cd api-gateway
npm install form-data multer
npm install --save-dev @types/multer
```

### Step 4: Rebuild and Restart Gateway

```bash
cd api-gateway
npm run build
PORT=3000 npm start
```

Test through gateway:

```bash
# Upload via gateway
curl -X POST http://localhost:3000/api/media/upload \
  -F "image=@test-image.jpg" \
  -F "nodeId=test-node-id"
```

---

## Client Image Upload UI

### Step 1: Install Dependencies

```bash
cd client
npm install react-dropzone react-modal
npm install --save-dev @types/react-modal
```

### Step 2: Create Media Types

Add to `client/src/types/index.ts`:

```typescript
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
  createdAt: string;
  updatedAt: string;
}

export interface UploadImageInput {
  file: File;
  nodeId?: string;
}
```

### Step 3: Create Media API Client

**File**: `client/src/api/media.api.ts`

```typescript
import { apiClient } from './client';
import { Media, UploadImageInput } from '../types';

export const mediaApi = {
  upload: async (data: UploadImageInput): Promise<Media> => {
    const formData = new FormData();
    formData.append('image', data.file);
    if (data.nodeId) {
      formData.append('nodeId', data.nodeId);
    }

    const response = await apiClient.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getById: async (id: string): Promise<Media> => {
    const response = await apiClient.get(`/media/${id}`);
    return response.data;
  },

  getByNode: async (nodeId: string): Promise<Media[]> => {
    const response = await apiClient.get(`/media/node/${nodeId}`);
    return response.data.media || [];
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/media/${id}`);
  },

  getFileUrl: (filename: string): string => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${API_URL}/api/media/file/${filename}`;
  },

  getThumbnailUrl: (filename: string): string => {
    return mediaApi.getFileUrl(filename);
  }
};
```

### Step 4: Create ImageUploader Component

**File**: `client/src/components/Image/ImageUploader.tsx`

```typescript
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { mediaApi } from '../../api/media.api';
import { Media } from '../../types';
import './ImageUploader.css';

interface ImageUploaderProps {
  nodeId: string;
  onUploadComplete: (media: Media) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ nodeId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const file = acceptedFiles[0];

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      const media = await mediaApi.upload({ file, nodeId });
      onUploadComplete(media);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  }, [nodeId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="image-uploader">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="upload-status">
            <div className="spinner"></div>
            <p>Uploading...</p>
          </div>
        ) : isDragActive ? (
          <p>Drop image here...</p>
        ) : (
          <div className="upload-prompt">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p>Drag & drop an image, or click to select</p>
            <span className="file-types">PNG, JPG, GIF, WebP (max 10MB)</span>
          </div>
        )}
      </div>
      {error && (
        <div className="upload-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
```

### Step 5: Create ImageUploader Styles

**File**: `client/src/components/Image/ImageUploader.css`

```css
.image-uploader {
  margin: 16px 0;
}

.dropzone {
  border: 2px dashed #cbd5e0;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f7fafc;
}

.dropzone:hover {
  border-color: #4299e1;
  background: #ebf8ff;
}

.dropzone.active {
  border-color: #3182ce;
  background: #bee3f8;
}

.dropzone.uploading {
  cursor: not-allowed;
  opacity: 0.6;
}

.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-prompt svg {
  color: #4299e1;
}

.upload-prompt p {
  margin: 0;
  color: #2d3748;
  font-weight: 500;
}

.file-types {
  font-size: 12px;
  color: #718096;
}

.upload-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #4299e1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.upload-error {
  margin-top: 12px;
  padding: 12px;
  background: #fed7d7;
  border: 1px solid #fc8181;
  border-radius: 6px;
  color: #c53030;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-icon {
  font-size: 18px;
}
```

### Step 6: Create ImageGallery Component

**File**: `client/src/components/Image/ImageGallery.tsx`

```typescript
import React, { useState } from 'react';
import { Media } from '../../types';
import { mediaApi } from '../../api/media.api';
import ImageLightbox from './ImageLightbox';
import './ImageGallery.css';

interface ImageGalleryProps {
  images: Media[];
  onDelete: (mediaId: string) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onDelete }) => {
  const [lightboxImage, setLightboxImage] = useState<Media | null>(null);

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <div className="image-gallery">
        <h4 className="gallery-title">Images ({images.length})</h4>
        <div className="gallery-grid">
          {images.map((media) => (
            <div key={media.id} className="gallery-item">
              <img
                src={mediaApi.getThumbnailUrl(media.thumbnailUrl || media.filename)}
                alt={media.originalName}
                className="gallery-thumbnail"
                onClick={() => setLightboxImage(media)}
              />
              <div className="gallery-item-actions">
                <button
                  className="delete-btn"
                  onClick={() => onDelete(media.id)}
                  title="Delete image"
                >
                  🗑️
                </button>
              </div>
              <div className="gallery-item-info">
                <span className="image-name">{media.originalName}</span>
                <span className="image-size">
                  {(media.sizeBytes / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {lightboxImage && (
        <ImageLightbox
          media={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>
  );
};

export default ImageGallery;
```

### Step 7: Create ImageGallery Styles

**File**: `client/src/components/Image/ImageGallery.css`

```css
.image-gallery {
  margin: 20px 0;
}

.gallery-title {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.gallery-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.gallery-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.gallery-thumbnail {
  width: 100%;
  height: 120px;
  object-fit: cover;
  cursor: pointer;
  display: block;
}

.gallery-item-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.gallery-item:hover .gallery-item-actions {
  opacity: 1;
}

.delete-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: #fed7d7;
  transform: scale(1.1);
}

.gallery-item-info {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.image-name {
  font-size: 12px;
  color: #2d3748;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-size {
  font-size: 11px;
  color: #718096;
}
```

### Step 8: Create ImageLightbox Component

**File**: `client/src/components/Image/ImageLightbox.tsx`

```typescript
import React from 'react';
import Modal from 'react-modal';
import { Media } from '../../types';
import { mediaApi } from '../../api/media.api';
import './ImageLightbox.css';

interface ImageLightboxProps {
  media: Media;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ media, onClose }) => {
  return (
    <Modal
      isOpen={true}
      onRequestClose={onClose}
      className="lightbox-content"
      overlayClassName="lightbox-overlay"
      ariaHideApp={false}
    >
      <button className="lightbox-close" onClick={onClose}>
        ✕
      </button>

      <div className="lightbox-image-container">
        <img
          src={mediaApi.getFileUrl(media.filename)}
          alt={media.originalName}
          className="lightbox-image"
        />
      </div>

      <div className="lightbox-info">
        <span className="lightbox-title">{media.originalName}</span>
        <div className="lightbox-meta">
          {media.width && media.height && (
            <span>{media.width} × {media.height}px</span>
          )}
          <span>{(media.sizeBytes / 1024).toFixed(1)} KB</span>
          <span>{media.mimeType}</span>
        </div>
      </div>
    </Modal>
  );
};

export default ImageLightbox;
```

### Step 9: Create ImageLightbox Styles

**File**: `client/src/components/Image/ImageLightbox.css`

```css
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  outline: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 2001;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.lightbox-image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 90vw;
  max-height: 80vh;
}

.lightbox-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.lightbox-info {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.lightbox-title {
  color: white;
  font-size: 16px;
  font-weight: 600;
}

.lightbox-meta {
  display: flex;
  gap: 16px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.lightbox-meta span {
  padding: 0 8px;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
}

.lightbox-meta span:last-child {
  border-right: none;
}
```

---

## Node Integration

### Step 1: Update Node Types

The Node model in the database already has `imageIds: string[]`. We need to update the client types to include media data.

Add to `client/src/types/index.ts`:

```typescript
// Update MindmapNode interface
export interface MindmapNode {
  id: string;
  mindmapId: string;
  title: string;
  content: any;
  position: Position;
  style: any;
  imageIds: string[];
  tags: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // Add media array (populated from imageIds)
  media?: Media[];
}
```

### Step 2: Update Zustand Store for Media

Add media actions to `client/src/store/mindmapStore.ts`:

```typescript
import { mediaApi } from '../api/media.api';

// Add to interface
interface MindmapStore {
  // ... existing state

  // Add media actions
  addImageToNode: (nodeId: string, mediaId: string) => Promise<void>;
  removeImageFromNode: (nodeId: string, mediaId: string) => Promise<void>;
  loadNodeImages: (nodeId: string) => Promise<Media[]>;
}

// Add to implementation
export const useMindmapStore = create<MindmapStore>((set, get) => ({
  // ... existing state and actions

  addImageToNode: async (nodeId: string, mediaId: string) => {
    const node = get().nodes.find(n => n.id === nodeId);
    if (!node) return;

    const updatedImageIds = [...(node.imageIds || []), mediaId];
    await nodeApi.update(nodeId, { imageIds: updatedImageIds });

    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, imageIds: updatedImageIds }
          : n
      )
    }));
  },

  removeImageFromNode: async (nodeId: string, mediaId: string) => {
    const node = get().nodes.find(n => n.id === nodeId);
    if (!node) return;

    const updatedImageIds = (node.imageIds || []).filter(id => id !== mediaId);
    await nodeApi.update(nodeId, { imageIds: updatedImageIds });

    // Delete the media file
    await mediaApi.delete(mediaId);

    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, imageIds: updatedImageIds }
          : n
      )
    }));
  },

  loadNodeImages: async (nodeId: string): Promise<Media[]> => {
    const node = get().nodes.find(n => n.id === nodeId);
    if (!node || !node.imageIds || node.imageIds.length === 0) {
      return [];
    }

    // Fetch media by node ID
    const media = await mediaApi.getByNode(nodeId);
    return media;
  }
}));
```

### Step 3: Update NodeEditor to Include Images

Update `client/src/components/Node/NodeEditor.tsx` to add image upload:

```typescript
import React, { useState, useEffect } from 'react';
import { useMindmapStore } from '../../store/mindmapStore';
import { Media } from '../../types';
import ImageUploader from '../Image/ImageUploader';
import ImageGallery from '../Image/ImageGallery';

// ... existing imports and interface

const NodeEditor: React.FC<NodeEditorProps> = ({ node, onClose }) => {
  const { updateNode, addImageToNode, removeImageFromNode, loadNodeImages } = useMindmapStore();

  const [title, setTitle] = useState(node.data.node.title);
  const [images, setImages] = useState<Media[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Load images when editor opens
  useEffect(() => {
    const fetchImages = async () => {
      setLoadingImages(true);
      try {
        const nodeImages = await loadNodeImages(node.id);
        setImages(nodeImages);
      } catch (error) {
        console.error('Failed to load images:', error);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchImages();
  }, [node.id]);

  const handleUploadComplete = async (media: Media) => {
    await addImageToNode(node.id, media.id);
    setImages([...images, media]);
  };

  const handleDeleteImage = async (mediaId: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      await removeImageFromNode(node.id, mediaId);
      setImages(images.filter(img => img.id !== mediaId));
    }
  };

  const handleSave = async () => {
    await updateNode(node.id, { title });
    onClose();
  };

  return (
    <div className="node-editor-modal">
      <div className="node-editor">
        <h2>Edit Node</h2>

        <label>
          Title:
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        {/* Image Section */}
        <div className="image-section">
          <ImageUploader
            nodeId={node.id}
            onUploadComplete={handleUploadComplete}
          />

          {loadingImages ? (
            <p>Loading images...</p>
          ) : (
            <ImageGallery
              images={images}
              onDelete={handleDeleteImage}
            />
          )}
        </div>

        <div className="editor-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default NodeEditor;
```

### Step 4: Update CustomNode to Show Thumbnails

Update `client/src/components/Node/CustomNode.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useMindmapStore } from '../../store/mindmapStore';
import { Media } from '../../types';
import { mediaApi } from '../../api/media.api';

interface CustomNodeProps {
  data: {
    label: string;
    node: any;
  };
  isConnectable: boolean;
}

const CustomNode: React.FC<CustomNodeProps> = ({ data, isConnectable }) => {
  const { loadNodeImages } = useMindmapStore();
  const [images, setImages] = useState<Media[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
      if (data.node.imageIds && data.node.imageIds.length > 0) {
        try {
          const nodeImages = await loadNodeImages(data.node.id);
          setImages(nodeImages);
        } catch (error) {
          console.error('Failed to load node images:', error);
        }
      }
    };

    fetchImages();
  }, [data.node.imageIds]);

  return (
    <div
      style={{
        padding: '10px 15px',
        borderRadius: '8px',
        background: '#fff',
        border: '2px solid #1a192b',
        minWidth: '150px',
        maxWidth: '250px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />

      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
        {data.label}
      </div>

      {/* Show image thumbnails if any */}
      {images.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap',
          marginTop: '8px'
        }}>
          {images.slice(0, 3).map((img) => (
            <img
              key={img.id}
              src={mediaApi.getThumbnailUrl(img.thumbnailUrl || img.filename)}
              alt={img.originalName}
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'cover',
                borderRadius: '4px',
                border: '1px solid #e2e8f0'
              }}
            />
          ))}
          {images.length > 3 && (
            <div style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#edf2f7',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#4a5568'
            }}>
              +{images.length - 3}
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
    </div>
  );
};

export default CustomNode;
```

---

## Testing the Complete Flow

### Test 1: Upload an Image

1. Open a mindmap with nodes
2. Double-click a node to open the editor
3. Drag an image file into the dropzone
4. Verify upload progress indicator appears
5. Verify image appears in gallery after upload

### Test 2: View Image Thumbnails in Node

1. Close the node editor
2. Verify the node card shows small thumbnails
3. If multiple images, verify "+N" indicator appears

### Test 3: Image Lightbox

1. Open node editor again
2. Click on a thumbnail in the gallery
3. Verify lightbox opens with full-size image
4. Verify image metadata displays correctly
5. Click outside or X button to close

### Test 4: Delete an Image

1. In node editor, hover over an image thumbnail
2. Click the delete button (🗑️)
3. Confirm deletion
4. Verify image is removed from gallery
5. Verify thumbnail removed from node card

### Test 5: Multiple Images

1. Upload 5 different images to a node
2. Verify all appear in gallery
3. Verify node card shows first 3 thumbnails + "+2"
4. Verify all persist after page refresh

### Test 6: File Validation

1. Try uploading a file > 10MB
2. Verify error message appears
3. Try uploading a non-image file (PDF, TXT)
4. Verify error message about invalid file type

### Test 7: API Testing

```bash
# Upload via API
curl -X POST http://localhost:3000/api/media/upload \
  -F "image=@test.jpg" \
  -F "nodeId=YOUR_NODE_ID"

# Get media by node
curl "http://localhost:3000/api/media/node/YOUR_NODE_ID"

# Delete media
curl -X DELETE http://localhost:3000/api/media/MEDIA_ID

# Verify files exist on disk
ls media-service/uploads/
# Should see both -original and -thumb files
```

---

## Success Criteria

Phase 4 is complete when ALL of the following are true:

### Functional Criteria

- [ ] **Image Upload**
  - Can upload PNG, JPG, GIF, WebP files
  - Drag-drop interface works smoothly
  - Upload progress indicator appears
  - Files saved to ./uploads/ directory

- [ ] **Thumbnails**
  - Thumbnails generated automatically (200x200px)
  - Both original and thumbnail files saved
  - Thumbnails display correctly

- [ ] **File Validation**
  - Files > 10MB rejected with error
  - Invalid file types rejected
  - Clear error messages shown

- [ ] **Node Integration**
  - Images associated with nodes via imageIds
  - Multiple images per node supported
  - Image thumbnails display in node cards
  - Image data persists after refresh

- [ ] **Image Gallery**
  - All node images display in editor
  - Click image to view full size
  - Delete button removes image
  - Gallery updates in real-time

- [ ] **Image Lightbox**
  - Full-size image displays in modal
  - Image metadata shown (dimensions, size, type)
  - Close button works
  - Click outside to close

### Database Criteria

- [ ] **Media Table**
  - Media records created correctly
  - nodeId foreign key works
  - Metadata populated (width, height, size)
  - Timestamps accurate

- [ ] **Node imageIds**
  - imageIds array updated correctly
  - Multiple imageIds supported
  - Removal updates array

### API Criteria

- [ ] **Media Service Endpoints**
  - POST /upload works with multipart/form-data
  - GET /:id returns media metadata
  - GET /file/:filename serves image files
  - DELETE /:id removes media and files

- [ ] **API Gateway Routes**
  - /api/media/upload proxies correctly
  - File uploads forwarded to media service
  - Static file serving works

### UI/UX Criteria

- [ ] **Drag-Drop**
  - Dropzone highlights on drag over
  - Drop uploads file immediately
  - Multiple drops work sequentially

- [ ] **Performance**
  - Image upload < 3 seconds for 5MB file
  - Thumbnail generation completes quickly
  - Node cards load thumbnails without lag

- [ ] **Error Handling**
  - Upload errors show user-friendly messages
  - Network errors handled gracefully
  - Validation errors clearly communicated

---

## Troubleshooting

### Issue 1: Upload fails with 500 error

**Symptoms**: "Failed to upload file" error

**Solutions**:
```bash
# Check media service is running
curl http://localhost:3003/health

# Verify uploads directory exists
ls media-service/uploads/

# Create if missing
mkdir -p media-service/uploads

# Check permissions
chmod 755 media-service/uploads

# Restart media service
cd media-service
npm run build
PORT=3003 npm start
```

### Issue 2: Thumbnails not generating

**Symptoms**: Only original image saved, no thumbnail

**Solutions**:
```bash
# Verify Sharp is installed
cd media-service
npm list sharp

# Reinstall Sharp if needed
npm uninstall sharp
npm install sharp

# Check for Sharp errors in logs
# Look for "Failed to generate thumbnail"

# Rebuild and restart
npm run build
PORT=3003 npm start
```

### Issue 3: Images not displaying in node cards

**Symptoms**: Node cards show no thumbnails despite uploads

**Solutions**:
```bash
# Check if imageIds are being saved
curl "http://localhost:3000/api/nodes/NODE_ID"
# Should show imageIds array with media IDs

# Verify media exists for those IDs
curl "http://localhost:3000/api/media/MEDIA_ID"

# Check browser console for image loading errors
# Open DevTools → Console

# Verify API URL is correct in client
# Check .env: VITE_API_URL=http://localhost:3000
```

### Issue 4: CORS error when uploading

**Symptoms**: "CORS policy" error in browser console

**Solutions**:
```bash
# Verify API Gateway has CORS enabled
# Check api-gateway/src/index.ts
# Should have: app.use(cors());

# Verify media service has CORS
# Check media-service/src/index.ts
# Add: app.use(cors());

# Restart both services
cd api-gateway && npm run build && npm start &
cd media-service && npm run build && npm start &
```

### Issue 5: Files serve as download instead of display

**Symptoms**: Clicking image downloads instead of showing in browser

**Solutions**:
```bash
# Verify Content-Type headers in media service
# Check media-service/src/controllers/media.controller.ts
# serveFile should use res.sendFile()

# Ensure proper MIME types
# Check media database records have correct mimeType

# Add Content-Type header manually if needed:
res.setHeader('Content-Type', media.mimeType);
res.sendFile(filePath);
```

### Issue 6: Lightbox doesn't open

**Symptoms**: Clicking thumbnail does nothing

**Solutions**:
```bash
# Verify react-modal is installed
cd client
npm list react-modal

# Install if missing
npm install react-modal @types/react-modal

# Check Modal is imported correctly
# In ImageLightbox.tsx should have:
# import Modal from 'react-modal';

# Verify onClick handler is attached
# In ImageGallery.tsx:
# onClick={() => setLightboxImage(media)}
```

### Issue 7: Upload progress doesn't show

**Symptoms**: No visual feedback during upload

**Solutions**:
```typescript
// Add upload progress tracking to ImageUploader
const [uploadProgress, setUploadProgress] = useState(0);

const media = await mediaApi.upload(
  { file, nodeId },
  (progress) => setUploadProgress(progress)
);

// Update API client to support progress
export const mediaApi = {
  upload: async (data: UploadImageInput, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('image', data.file);

    const response = await apiClient.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    });

    return response.data;
  }
};
```

---

## Performance Considerations

### Image Optimization

1. **Lazy Loading**: Load thumbnails only when node is visible
2. **Caching**: Browser caches images by filename
3. **Compression**: Sharp automatically optimizes images
4. **Thumbnail Strategy**: 200x200px thumbnails are small and fast

### Database Performance

1. **Indexes**: nodeId and filename indexed for fast queries
2. **Bulk Fetching**: Get multiple media records in one query
3. **Pagination**: Limit large galleries to prevent slowdowns

### File Storage

1. **Cleanup**: Orphaned media cleaned up after 24 hours
2. **Disk Space**: Monitor uploads/ directory size
3. **Backups**: Consider backing up uploads/ periodically

### Client Performance

1. **Virtual Scrolling**: For nodes with many images
2. **Image Sprites**: Combine small thumbnails if needed
3. **Debouncing**: Debounce upload requests

---

## Next Steps: Phase 5

Phase 4 provides rich media capabilities. Phase 5 will add:

1. **Polish & UX**: Smooth interactions, loading states
2. **Search UI**: Search nodes by content and images
3. **Keyboard Shortcuts**: Fast navigation and actions
4. **Context Menus**: Right-click operations
5. **Error Notifications**: Toast messages for errors
6. **Auto-save Indicators**: Show save status

To begin Phase 5, ensure Phase 4 success criteria are met, then refer to the PRD for Phase 5 details.

---

## Estimated Time

- **Media Service Implementation:** 3-4 hours
- **API Gateway Integration:** 1 hour
- **Client Image Upload UI:** 3-4 hours
- **Node Integration:** 2 hours
- **Testing & Debugging:** 2-3 hours
- **Polish & Edge Cases:** 2 hours

**Total:** ~13-16 hours (spread over 2-3 days)

---

## Summary

Phase 4 adds comprehensive media/image capabilities:

✅ **Backend:** Complete media service with upload, storage, thumbnails
✅ **API Gateway:** Media routes with multipart/form-data handling
✅ **Frontend:** Drag-drop upload, gallery, lightbox
✅ **Integration:** Images associated with nodes, displayed in cards
✅ **Persistence:** All media stored locally in ./uploads/
✅ **Validation:** File type and size validation
✅ **UX:** Smooth drag-drop, instant thumbnails, beautiful lightbox

This gives you a production-ready image management system integrated seamlessly with your mindmap nodes.

---

**Document Status:** Ready for Implementation
**Created:** November 3, 2025
**Phase:** 4 of 6

---

**END OF PHASE 4 IMPLEMENTATION GUIDE**
