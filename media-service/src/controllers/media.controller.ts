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
        nodeId: nodeId || undefined,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size
      });

      res.status(201).json(media);
    } catch (error: any) {
      console.error('Error uploading file:', {
        message: error.message,
        code: error.code,
        filename: req.file?.filename,
        originalname: req.file?.originalname,
        nodeId: req.body.nodeId
      });

      // Provide specific error messages
      let errorMessage = 'Failed to upload file';
      let statusCode = 500;

      if (error.code === 'ENOENT') {
        errorMessage = 'Upload directory does not exist';
      } else if (error.message.includes('Sharp')) {
        errorMessage = 'Failed to process image - file may be corrupted';
        statusCode = 400;
      } else if (error.message.includes('database')) {
        errorMessage = 'Database error while saving media';
      }

      res.status(statusCode).json({
        error: errorMessage,
        details: error.message
      });
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
      const { nodeId } = req.params;

      const media = await mediaService.getMediaByNode(nodeId);
      res.json({ media });
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ error: 'Failed to fetch media' });
    }
  }

  async getByIds(req: Request, res: Response) {
    try {
      console.log('[CONTROLLER] GET /bulk called');
      console.log('[CONTROLLER] Query params:', req.query);

      const { ids } = req.query;

      if (!ids || typeof ids !== 'string') {
        return res.status(400).json({ error: 'ids query parameter is required' });
      }

      const idArray = ids.split(',');
      const media = await mediaService.getMediaByIds(idArray);

      console.log('[CONTROLLER] Returning media count:', media.length);
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

  async importLocal(req: Request, res: Response) {
    try {
      console.log('[CONTROLLER] POST /import-local called');
      console.log('[CONTROLLER] Request body:', req.body);

      const { id, sourceFilename, sourceThumbnail, originalName, mimeType, width, height } = req.body;

      if (!id || !sourceFilename || !originalName || !mimeType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const media = await mediaService.importFromLocal({
        id,
        sourceFilename,
        sourceThumbnail,
        originalName,
        mimeType,
        width,
        height
      });

      console.log('[CONTROLLER] Successfully imported media:', media.id);
      res.status(201).json(media);
    } catch (error: any) {
      console.error('[CONTROLLER] Error importing media:', error.message);
      console.error('[CONTROLLER] Stack trace:', error.stack);
      console.error('Error importing local media:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to import media'
      });
    }
  }

  async importS3(req: Request, res: Response) {
    try {
      const { id, sourceUrl, originalName, mimeType, width, height } = req.body;

      if (!id || !sourceUrl || !originalName || !mimeType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const media = await mediaService.importFromS3({
        id,
        sourceUrl,
        originalName,
        mimeType,
        width,
        height
      });

      res.status(201).json(media);
    } catch (error: any) {
      console.error('Error importing S3 media:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to import media'
      });
    }
  }

  async migrateToS3(req: Request, res: Response) {
    try {
      const { id, sourceFilename, sourceThumbnail, originalName, mimeType, width, height } = req.body;

      if (!id || !sourceFilename || !originalName || !mimeType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const media = await mediaService.migrateLocalToS3({
        id,
        sourceFilename,
        sourceThumbnail,
        originalName,
        mimeType,
        width,
        height
      });

      res.status(201).json(media);
    } catch (error: any) {
      console.error('Error migrating to S3:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to migrate to S3'
      });
    }
  }

  async migrateToLocal(req: Request, res: Response) {
    try {
      const { id, sourceUrl, originalName, mimeType, width, height } = req.body;

      if (!id || !sourceUrl || !originalName || !mimeType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const media = await mediaService.migrateS3ToLocal({
        id,
        sourceUrl,
        originalName,
        mimeType,
        width,
        height
      });

      res.status(201).json(media);
    } catch (error: any) {
      console.error('Error migrating to local:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to migrate to local'
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nodeId } = req.body;

      const media = await mediaService.updateMedia(id, { nodeId });
      res.json(media);
    } catch (error: any) {
      if (error.message === 'Media not found after update') {
        return res.status(404).json({ error: 'Media not found' });
      }
      console.error('Error updating media:', error);
      res.status(500).json({ error: 'Failed to update media' });
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
