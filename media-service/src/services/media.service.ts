import { Media } from '../entities/Media';
import { AppDataSource } from '../data-source';
import { storageService } from './storage.service';
import { LessThan, In } from 'typeorm';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

export interface CreateMediaInput {
  nodeId?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export class MediaService {
  private mediaRepository = AppDataSource.getRepository(Media);

  async createMedia(data: CreateMediaInput): Promise<Media> {
    // Get image dimensions
    const dimensions = await storageService.getImageDimensions(data.filename);

    // Generate thumbnail
    const thumbnailFilename = await storageService.generateThumbnail(data.filename);

    // Create entity instance
    const media = this.mediaRepository.create({
      nodeId: data.nodeId,
      filename: data.filename,
      originalName: data.originalName,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      width: dimensions.width,
      height: dimensions.height,
      url: `/media/${data.filename}`,
      thumbnailUrl: `/media/${thumbnailFilename}`
    });

    // Save to database
    return await this.mediaRepository.save(media);
  }

  async getMediaById(id: string): Promise<Media | null> {
    return await this.mediaRepository.findOne({
      where: { id }
    });
  }

  async getMediaByNode(nodeId: string): Promise<Media[]> {
    return await this.mediaRepository.find({
      where: { nodeId },
      order: { createdAt: 'ASC' }
    });
  }

  async getMediaByIds(ids: string[]): Promise<Media[]> {
    return await this.mediaRepository.find({
      where: {
        id: In(ids)
      },
      order: { createdAt: 'ASC' }
    });
  }

  async updateMedia(id: string, data: { nodeId?: string }): Promise<Media> {
    await this.mediaRepository.update({ id }, data);
    const updated = await this.mediaRepository.findOne({ where: { id } });
    if (!updated) {
      throw new Error('Media not found after update');
    }
    return updated;
  }

  async deleteMedia(id: string): Promise<void> {
    const media = await this.mediaRepository.findOne({
      where: { id }
    });

    if (!media) {
      throw new Error('Media not found');
    }

    // Delete from database
    await this.mediaRepository.delete({ id });

    // Delete files from disk (if using local storage)
    if (media.filename) {
      await storageService.deleteImageAndThumbnail(media.filename);
    }
  }

  async cleanupOrphanedMedia(): Promise<number> {
    // Find media not attached to any node and older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const orphaned = await this.mediaRepository.find({
      where: {
        nodeId: null as any,
        createdAt: LessThan(oneDayAgo)
      }
    });

    // Delete each orphaned media
    for (const media of orphaned) {
      await this.deleteMedia(media.id);
    }

    return orphaned.length;
  }

  /**
   * Import media from local files (Local -> Local)
   * Copies existing files from uploads/ directory
   */
  async importFromLocal(data: {
    id: string;
    sourceFilename: string;
    sourceThumbnail?: string;
    originalName: string;
    mimeType: string;
    width?: number;
    height?: number;
  }): Promise<Media> {
    const uploadDir = path.join(__dirname, '../../uploads');
    const sourcePath = path.join(uploadDir, data.sourceFilename);

    // Check if source file exists
    try {
      await fs.access(sourcePath);
    } catch (error) {
      const err: any = new Error('Source file not found');
      err.statusCode = 404;
      throw err;
    }

    // Generate new filenames
    const ext = path.extname(data.sourceFilename);
    const newFilename = `${data.id}_${Date.now()}${ext}`;
    const newThumbnail = `${data.id}_${Date.now()}_thumb${ext}`;

    const destPath = path.join(uploadDir, newFilename);
    const destThumbnailPath = path.join(uploadDir, newThumbnail);

    // Copy files
    await fs.copyFile(sourcePath, destPath);

    if (data.sourceThumbnail) {
      const sourceThumbnailPath = path.join(uploadDir, data.sourceThumbnail);
      try {
        await fs.copyFile(sourceThumbnailPath, destThumbnailPath);
      } catch (error) {
        console.warn('Failed to copy thumbnail, generating new one');
        await storageService.generateThumbnail(newFilename);
      }
    } else {
      // Generate thumbnail if not provided
      await storageService.generateThumbnail(newFilename);
    }

    // Get file size
    const stats = await fs.stat(destPath);

    // Get or use provided dimensions
    let dimensions = { width: data.width, height: data.height };
    if (!dimensions.width || !dimensions.height) {
      dimensions = await storageService.getImageDimensions(newFilename);
    }

    // Create Media record
    const media = this.mediaRepository.create({
      id: data.id,
      filename: newFilename,
      thumbnailFilename: newThumbnail,
      originalName: data.originalName,
      mimeType: data.mimeType,
      sizeBytes: stats.size,
      width: dimensions.width,
      height: dimensions.height,
      url: `/media/${newFilename}`,
      thumbnailUrl: `/media/${newThumbnail}`
    });

    return await this.mediaRepository.save(media);
  }

  /**
   * Import media from S3 (S3 -> S3)
   * Downloads from S3 and re-uploads with new key
   */
  async importFromS3(data: {
    id: string;
    sourceUrl: string;
    originalName: string;
    mimeType: string;
    width?: number;
    height?: number;
  }): Promise<Media> {
    // TODO: Implement S3 import when S3 service is ready
    throw new Error('S3 import not yet implemented - S3 service required');
  }

  /**
   * Migrate: Local file -> S3
   * Reads local file and uploads to S3
   */
  async migrateLocalToS3(data: {
    id: string;
    sourceFilename: string;
    sourceThumbnail?: string;
    originalName: string;
    mimeType: string;
    width?: number;
    height?: number;
  }): Promise<Media> {
    // TODO: Implement local-to-S3 migration when S3 service is ready
    throw new Error('Local-to-S3 migration not yet implemented - S3 service required');
  }

  /**
   * Migrate: S3 URL -> Local file
   * Downloads from S3 and saves to local disk
   */
  async migrateS3ToLocal(data: {
    id: string;
    sourceUrl: string;
    originalName: string;
    mimeType: string;
    width?: number;
    height?: number;
  }): Promise<Media> {
    const uploadDir = path.join(__dirname, '../../uploads');

    // Download from S3
    const response = await axios.get(data.sourceUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    // Generate new filenames
    const ext = data.mimeType.split('/')[1];
    const newFilename = `${data.id}_${Date.now()}.${ext}`;
    const destPath = path.join(uploadDir, newFilename);

    // Save file
    await fs.writeFile(destPath, buffer);

    // Generate thumbnail
    const thumbnailFilename = await storageService.generateThumbnail(newFilename);

    // Get file size
    const stats = await fs.stat(destPath);

    // Get or use provided dimensions
    let dimensions = { width: data.width, height: data.height };
    if (!dimensions.width || !dimensions.height) {
      dimensions = await storageService.getImageDimensions(newFilename);
    }

    // Create Media record
    const media = this.mediaRepository.create({
      id: data.id,
      filename: newFilename,
      thumbnailFilename,
      originalName: data.originalName,
      mimeType: data.mimeType,
      sizeBytes: stats.size,
      width: dimensions.width,
      height: dimensions.height,
      url: `/media/${newFilename}`,
      thumbnailUrl: `/media/${thumbnailFilename}`
    });

    return await this.mediaRepository.save(media);
  }
}

export const mediaService = new MediaService();
