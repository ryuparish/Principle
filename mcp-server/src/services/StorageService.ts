import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../config/logging.js';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
};

export interface SaveFromUrlOptions {
  maxSizeBytes?: number;    // Default: 10MB
  timeoutMs?: number;       // Default: 30s
}

export interface SaveFromUrlResult {
  filename: string;
  sizeBytes: number;
  originalName: string;
  mimeType: string;
}

export class StorageService {
  private uploadsDir: string;

  constructor(uploadsDir?: string) {
    // Use media-service's uploads directory for consistency
    this.uploadsDir = uploadsDir ||
      '/Users/ryuparish/Code/Principle/media-service/uploads';
  }

  async ensureUploadsDir(): Promise<void> {
    await fs.mkdir(this.uploadsDir, { recursive: true });
  }

  async saveFromBase64(
    base64Data: string,
    originalName: string
  ): Promise<{ filename: string; sizeBytes: number }> {
    await this.ensureUploadsDir();

    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    const id = crypto.randomUUID();
    const ext = path.extname(originalName) || '.png';
    const filename = `${id}_${Date.now()}${ext}`;
    const filePath = path.join(this.uploadsDir, filename);

    await fs.writeFile(filePath, buffer);
    logger.info('Saved image from base64', { filename, size: buffer.length });

    return { filename, sizeBytes: buffer.length };
  }

  async copyFromPath(
    sourcePath: string
  ): Promise<{ filename: string; sizeBytes: number; originalName: string }> {
    await this.ensureUploadsDir();

    const stats = await fs.stat(sourcePath);
    const originalName = path.basename(sourcePath);
    const id = crypto.randomUUID();
    const ext = path.extname(sourcePath);
    const filename = `${id}_${Date.now()}${ext}`;
    const destPath = path.join(this.uploadsDir, filename);

    await fs.copyFile(sourcePath, destPath);
    logger.info('Copied image from path', { source: sourcePath, filename, size: stats.size });

    return { filename, sizeBytes: stats.size, originalName };
  }

  async generateThumbnail(filename: string): Promise<string> {
    const originalPath = path.join(this.uploadsDir, filename);
    const ext = path.extname(filename);
    const nameWithoutExt = filename.slice(0, -ext.length);
    const thumbnailFilename = `${nameWithoutExt}-thumb${ext}`;
    const thumbnailPath = path.join(this.uploadsDir, thumbnailFilename);

    await sharp(originalPath)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(thumbnailPath);

    logger.info('Generated thumbnail', { original: filename, thumbnail: thumbnailFilename });
    return thumbnailFilename;
  }

  async getImageDimensions(filename: string): Promise<{ width: number; height: number }> {
    const filePath = path.join(this.uploadsDir, filename);
    const metadata = await sharp(filePath).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.uploadsDir, filename);
    try {
      await fs.unlink(filePath);
      logger.info('Deleted file', { filename });
    } catch (error) {
      // Ignore if file doesn't exist
      logger.debug('File not found for deletion', { filename });
    }
  }

  async deleteImageAndThumbnail(originalFilename: string): Promise<void> {
    const ext = path.extname(originalFilename);
    const nameWithoutExt = originalFilename.slice(0, -ext.length);
    const thumbnailFilename = `${nameWithoutExt}-thumb${ext}`;
    await this.deleteFile(originalFilename);
    await this.deleteFile(thumbnailFilename);
  }

  async saveFromUrl(
    url: string,
    options: SaveFromUrlOptions = {}
  ): Promise<SaveFromUrlResult> {
    await this.ensureUploadsDir();

    const maxSize = options.maxSizeBytes || 10 * 1024 * 1024;  // 10MB
    const timeout = options.timeoutMs || 30000;  // 30 seconds

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are supported');
    }

    logger.info('Fetching image from URL', { url });

    // Fetch the image using native fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Principle-MCP-Server/1.0',
          'Accept': 'image/*'
        },
        redirect: 'follow'
      });
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timed out after ${timeout / 1000} seconds`);
        }
        throw new Error(`Failed to fetch URL: ${error.message}`);
      }
      throw new Error('Failed to fetch URL: Unknown error');
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch image: HTTP ${response.status} ${response.statusText}`);
    }

    // Validate content type
    const contentType = response.headers.get('content-type')?.split(';')[0].trim();
    if (!contentType || !ALLOWED_MIME_TYPES.includes(contentType)) {
      throw new Error(
        `Unsupported content type: ${contentType || 'unknown'}. ` +
        `Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    // Check content-length if available
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxSize) {
      throw new Error(
        `Image too large: ${(parseInt(contentLength) / 1024 / 1024).toFixed(1)}MB. ` +
        `Maximum allowed: ${(maxSize / 1024 / 1024).toFixed(1)}MB`
      );
    }

    // Download the image
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sizeBytes = buffer.length;

    if (sizeBytes > maxSize) {
      throw new Error(
        `Image too large: ${(sizeBytes / 1024 / 1024).toFixed(1)}MB. ` +
        `Maximum allowed: ${(maxSize / 1024 / 1024).toFixed(1)}MB`
      );
    }

    // Determine original filename
    const originalName = this.extractFilenameFromResponse(response, parsedUrl, contentType);

    // Generate unique filename
    const id = crypto.randomUUID();
    const ext = MIME_TO_EXT[contentType] || '.png';
    const filename = `${id}_${Date.now()}${ext}`;
    const filePath = path.join(this.uploadsDir, filename);

    // Save to disk
    await fs.writeFile(filePath, buffer);
    logger.info('Saved image from URL', { url, filename, size: sizeBytes });

    return { filename, sizeBytes, originalName, mimeType: contentType };
  }

  private extractFilenameFromResponse(
    response: Response,
    parsedUrl: URL,
    contentType: string
  ): string {
    // Try Content-Disposition header
    const disposition = response.headers.get('content-disposition');
    if (disposition) {
      const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        return filenameMatch[1].replace(/['"]/g, '');
      }
    }

    // Try URL path
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      const lastSegment = pathSegments[pathSegments.length - 1];
      // Check if it looks like a filename with image extension
      if (/\.(jpe?g|png|gif|webp)$/i.test(lastSegment)) {
        try {
          return decodeURIComponent(lastSegment);
        } catch {
          return lastSegment;
        }
      }
    }

    // Fallback to generated name
    const ext = MIME_TO_EXT[contentType] || '.png';
    return `image_${Date.now()}${ext}`;
  }
}
