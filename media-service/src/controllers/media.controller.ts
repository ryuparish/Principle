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
