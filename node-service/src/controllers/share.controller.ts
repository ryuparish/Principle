import { Request, Response } from 'express';
import { shareService } from '../services/share.service';
import { htmlGeneratorService } from '../services/html-generator.service';

export class ShareController {
  /**
   * POST /mindmaps/:id/share
   * Enable sharing for a concept map
   */
  async enableSharing(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { visibility, regenerateSlug } = req.body;

      if (!visibility || (visibility !== 'public' && visibility !== 'unlisted')) {
        return res.status(400).json({
          error: 'visibility must be either "public" or "unlisted"'
        });
      }

      const settings = await shareService.enableSharing(id, {
        visibility,
        regenerateSlug
      });

      res.json(settings);
    } catch (error: any) {
      console.error('Error enabling sharing:', error);
      if (error.message === 'Map not found') {
        return res.status(404).json({ error: 'Map not found' });
      }
      res.status(500).json({ error: 'Failed to enable sharing' });
    }
  }

  /**
   * DELETE /mindmaps/:id/share
   * Disable sharing for a concept map
   */
  async disableSharing(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await shareService.disableSharing(id);

      res.json({ success: true, message: 'Sharing disabled' });
    } catch (error: any) {
      console.error('Error disabling sharing:', error);
      if (error.message === 'Map not found') {
        return res.status(404).json({ error: 'Map not found' });
      }
      res.status(500).json({ error: 'Failed to disable sharing' });
    }
  }

  /**
   * GET /mindmaps/:id/share
   * Get sharing settings for a concept map
   */
  async getShareSettings(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const settings = await shareService.getShareSettings(id);

      if (!settings) {
        return res.status(404).json({ error: 'Map is not shared' });
      }

      res.json(settings);
    } catch (error: any) {
      console.error('Error getting share settings:', error);
      if (error.message === 'Map not found') {
        return res.status(404).json({ error: 'Map not found' });
      }
      res.status(500).json({ error: 'Failed to get share settings' });
    }
  }

  /**
   * GET /share/:shareSlug
   * Returns complete map data as JSON
   */
  async getSharedMap(req: Request, res: Response) {
    try {
      const { shareSlug } = req.params;
      const { token } = req.query;

      const data = await shareService.getSharedMapData(
        shareSlug,
        token as string
      );

      res.json(data);
    } catch (error: any) {
      console.error('Error fetching shared map:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Failed to fetch shared map' });
    }
  }

  /**
   * GET /share/:shareSlug/download.json
   * Downloads map as JSON file
   */
  async downloadJSON(req: Request, res: Response) {
    try {
      const { shareSlug } = req.params;
      const { token } = req.query;

      const data = await shareService.getSharedMapData(
        shareSlug,
        token as string
      );

      const filename = `${shareSlug}.json`;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(data);
    } catch (error: any) {
      console.error('Error downloading JSON:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Failed to download map' });
    }
  }

  /**
   * GET /share/:shareSlug/download.html
   * Downloads standalone HTML viewer
   */
  async downloadHTML(req: Request, res: Response) {
    try {
      const { shareSlug } = req.params;
      const { token } = req.query;

      // Get the map data
      const data = await shareService.getSharedMapData(
        shareSlug,
        token as string
      );

      // Generate HTML with embedded data
      const html = await htmlGeneratorService.generateHTML(data);

      // Create safe filename from map name
      const safeFileName = data.map.name
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase()
        .replace(/-+/g, '-')
        .slice(0, 50);

      const filename = `${safeFileName}.html`;

      // Set headers for download
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(html, 'utf-8'));

      // Send HTML
      res.send(html);
    } catch (error: any) {
      console.error('Error downloading HTML:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        error: error.message || 'Failed to generate HTML viewer'
      });
    }
  }
}

export const shareController = new ShareController();
