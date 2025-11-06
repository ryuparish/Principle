import { Media } from '../entities/Media';
import { AppDataSource } from '../data-source';
import { storageService } from './storage.service';
import { LessThan } from 'typeorm';

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
        id: { in: ids } as any
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

    // Delete files from disk
    await storageService.deleteImageAndThumbnail(media.filename);
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
}

export const mediaService = new MediaService();
