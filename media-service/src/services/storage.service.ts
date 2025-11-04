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
