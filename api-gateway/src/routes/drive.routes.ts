import { Router, Request, Response } from 'express';
import { googleAuthService } from '../services/google-auth.service';

const router = Router();

/**
 * GET /api/drive/files
 * List/search files from Google Drive
 * Query params:
 *   - q: search query (optional)
 *   - pageToken: pagination token (optional)
 *   - pageSize: number of results (default 20, max 100)
 */
router.get('/files', async (req: Request, res: Response) => {
  try {
    const { q, pageToken, pageSize = '20' } = req.query;

    const drive = await googleAuthService.getDriveClient();

    // Build query - search in name and fullText
    let query = 'trashed = false';
    if (q && typeof q === 'string') {
      query += ` and (name contains '${q.replace(/'/g, "\\'")}' or fullText contains '${q.replace(/'/g, "\\'")}')`;
    }

    const response = await drive.files.list({
      q: query,
      pageSize: Math.min(parseInt(pageSize as string) || 20, 100),
      pageToken: pageToken as string || undefined,
      fields: 'nextPageToken, files(id, name, mimeType, iconLink, thumbnailLink, webViewLink, size, createdTime, modifiedTime)',
      orderBy: 'modifiedTime desc'
    });

    res.json({
      files: response.data.files || [],
      nextPageToken: response.data.nextPageToken
    });
  } catch (error: any) {
    console.error('[DRIVE] List files error:', error.message);

    if (error.message === 'Not connected to Google') {
      res.status(401).json({ error: 'Not connected to Google Drive' });
      return;
    }

    res.status(500).json({
      error: error.message || 'Failed to list files'
    });
  }
});

/**
 * GET /api/drive/files/:fileId
 * Get details of a specific file
 */
router.get('/files/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

    const drive = await googleAuthService.getDriveClient();

    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, iconLink, thumbnailLink, webViewLink, size, createdTime, modifiedTime, parents'
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('[DRIVE] Get file error:', error.message);

    if (error.message === 'Not connected to Google') {
      res.status(401).json({ error: 'Not connected to Google Drive' });
      return;
    }

    if (error.code === 404) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    res.status(500).json({
      error: error.message || 'Failed to get file'
    });
  }
});

/**
 * GET /api/drive/files/:fileId/children
 * List children of a folder
 */
router.get('/files/:fileId/children', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const { pageToken, pageSize = '20' } = req.query;

    const drive = await googleAuthService.getDriveClient();

    const response = await drive.files.list({
      q: `'${fileId}' in parents and trashed = false`,
      pageSize: Math.min(parseInt(pageSize as string) || 20, 100),
      pageToken: pageToken as string || undefined,
      fields: 'nextPageToken, files(id, name, mimeType, iconLink, thumbnailLink, webViewLink, size, createdTime, modifiedTime)',
      orderBy: 'folder, name'
    });

    res.json({
      files: response.data.files || [],
      nextPageToken: response.data.nextPageToken
    });
  } catch (error: any) {
    console.error('[DRIVE] List children error:', error.message);

    if (error.message === 'Not connected to Google') {
      res.status(401).json({ error: 'Not connected to Google Drive' });
      return;
    }

    res.status(500).json({
      error: error.message || 'Failed to list folder contents'
    });
  }
});

export default router;
