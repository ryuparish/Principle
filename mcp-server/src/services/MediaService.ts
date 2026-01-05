import { DataSource, Repository } from 'typeorm';
import { Media } from '../entities/Media.js';
import { Node } from '../entities/Node.js';
import { StorageService } from './StorageService.js';
import { logger } from '../config/logging.js';

export interface UploadImageInput {
  nodeId: string;
  base64Data?: string;      // Base64-encoded image data
  filePath?: string;        // Local file path
  url?: string;             // URL to fetch image from
  originalName?: string;    // Original filename (required for base64)
}

export class MediaService {
  private mediaRepository: Repository<Media>;
  private nodeRepository: Repository<Node>;
  private storageService: StorageService;
  private dataSource: DataSource;
  private tableEnsured = false;

  constructor(dataSource: DataSource, storageService: StorageService) {
    this.dataSource = dataSource;
    this.mediaRepository = dataSource.getRepository(Media);
    this.nodeRepository = dataSource.getRepository(Node);
    this.storageService = storageService;
  }

  private async ensureMediaTable(): Promise<void> {
    if (this.tableEnsured) return;

    try {
      const tables = await this.dataSource.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='media'"
      );

      if (tables.length === 0) {
        logger.info('Creating media table on demand...');
        await this.dataSource.query(`
          CREATE TABLE IF NOT EXISTS media (
            id TEXT PRIMARY KEY,
            nodeId TEXT,
            filename TEXT UNIQUE,
            thumbnailFilename TEXT,
            originalName TEXT NOT NULL,
            mimeType TEXT NOT NULL,
            sizeBytes INTEGER NOT NULL,
            width INTEGER,
            height INTEGER,
            url TEXT,
            thumbnailUrl TEXT,
            s3Key TEXT,
            s3Url TEXT,
            thumbnailS3Key TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await this.dataSource.query('CREATE INDEX IF NOT EXISTS idx_media_nodeId ON media(nodeId)');
        await this.dataSource.query('CREATE INDEX IF NOT EXISTS idx_media_filename ON media(filename)');
        logger.info('Media table created successfully');
      }
      this.tableEnsured = true;
    } catch (error) {
      logger.error('Failed to ensure media table', error);
      throw error;
    }
  }

  async uploadImage(input: UploadImageInput): Promise<Media> {
    await this.ensureMediaTable();
    logger.info('Uploading image', { nodeId: input.nodeId });

    // Validate node exists
    const node = await this.nodeRepository.findOne({
      where: { id: input.nodeId, isDeleted: false }
    });
    if (!node) {
      throw new Error(`Node ${input.nodeId} not found`);
    }

    let filename: string;
    let sizeBytes: number;
    let originalName: string;
    let mimeType: string;

    if (input.base64Data) {
      if (!input.originalName) {
        throw new Error('originalName is required when using base64Data');
      }
      const result = await this.storageService.saveFromBase64(
        input.base64Data,
        input.originalName
      );
      filename = result.filename;
      sizeBytes = result.sizeBytes;
      originalName = input.originalName;
      mimeType = this.getMimeType(originalName);
    } else if (input.filePath) {
      const result = await this.storageService.copyFromPath(input.filePath);
      filename = result.filename;
      sizeBytes = result.sizeBytes;
      originalName = result.originalName;
      mimeType = this.getMimeType(originalName);
    } else if (input.url) {
      const result = await this.storageService.saveFromUrl(input.url, {
        maxSizeBytes: 10 * 1024 * 1024,  // 10MB
        timeoutMs: 30000  // 30 seconds
      });
      filename = result.filename;
      sizeBytes = result.sizeBytes;
      originalName = input.originalName || result.originalName;
      mimeType = result.mimeType;
    } else {
      throw new Error('Either base64Data, filePath, or url is required');
    }

    // Generate thumbnail
    const thumbnailFilename = await this.storageService.generateThumbnail(filename);

    // Get dimensions
    const dimensions = await this.storageService.getImageDimensions(filename);

    // Create Media record
    const media = this.mediaRepository.create({
      nodeId: input.nodeId,
      filename,
      thumbnailFilename,
      originalName,
      mimeType,
      sizeBytes,
      width: dimensions.width,
      height: dimensions.height,
      url: `/media/${filename}`,
      thumbnailUrl: `/media/${thumbnailFilename}`
    });

    const savedMedia = await this.mediaRepository.save(media);
    logger.info('Media saved', { mediaId: savedMedia.id });

    // Update node's imageIds array
    const currentImageIds = node.imageIds || [];
    node.imageIds = [...currentImageIds, savedMedia.id];
    await this.nodeRepository.save(node);
    logger.info('Node imageIds updated', {
      nodeId: node.id,
      imageCount: node.imageIds.length
    });

    return savedMedia;
  }

  async getMediaById(id: string): Promise<Media | null> {
    await this.ensureMediaTable();
    return await this.mediaRepository.findOne({ where: { id } });
  }

  async getMediaByNode(nodeId: string): Promise<Media[]> {
    await this.ensureMediaTable();
    return await this.mediaRepository.find({
      where: { nodeId },
      order: { createdAt: 'ASC' }
    });
  }

  async deleteMedia(id: string): Promise<void> {
    await this.ensureMediaTable();
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new Error('Media not found');
    }

    // Remove from node's imageIds if attached
    if (media.nodeId) {
      const node = await this.nodeRepository.findOne({
        where: { id: media.nodeId }
      });
      if (node) {
        node.imageIds = (node.imageIds || []).filter(imgId => imgId !== id);
        await this.nodeRepository.save(node);
        logger.info('Removed image from node', { nodeId: node.id, mediaId: id });
      }
    }

    // Delete from database
    await this.mediaRepository.delete({ id });

    // Delete files from disk
    if (media.filename) {
      await this.storageService.deleteImageAndThumbnail(media.filename);
    }

    logger.info('Media deleted', { mediaId: id });
  }

  private getMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}
