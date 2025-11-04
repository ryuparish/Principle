import { Media } from '../../node_modules/.prisma/client-media';
import { prisma } from '../lib/prisma';
import { storageService } from './storage.service';

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
