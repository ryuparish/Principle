import { Router, Request, Response } from 'express';
import axios from 'axios';
import { services } from '../config/services.config';

const router = Router();

// Public share endpoints (no auth required)
// Get shared map data
router.get('/:shareSlug', async (req: Request, res: Response) => {
  try {
    const { shareSlug } = req.params;
    const { token } = req.query;

    const url = `${services.nodeService}/share/${shareSlug}`;
    const response = await axios.get(url, {
      params: token ? { token } : {}
    });

    // Cache public share data for 5 minutes
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching shared map:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch shared map'
    });
  }
});

// Download JSON file
router.get('/:shareSlug/download.json', async (req: Request, res: Response) => {
  try {
    const { shareSlug } = req.params;
    const { token } = req.query;

    const url = `${services.nodeService}/share/${shareSlug}/download.json`;
    const response = await axios.get(url, {
      params: token ? { token } : {},
      responseType: 'json'
    });

    const filename = `${shareSlug}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    res.json(response.data);
  } catch (error: any) {
    console.error('Error downloading JSON:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to download map'
    });
  }
});

// Download HTML file
router.get('/:shareSlug/download.html', async (req: Request, res: Response) => {
  try {
    const { shareSlug } = req.params;
    const { token } = req.query;

    const url = `${services.nodeService}/share/${shareSlug}/download.html`;
    const response = await axios.get(url, {
      params: token ? { token } : {},
      responseType: 'text'
    });

    // Forward the headers from node-service
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    if (response.headers['content-disposition']) {
      res.setHeader('Content-Disposition', response.headers['content-disposition']);
    }
    res.send(response.data);
  } catch (error: any) {
    console.error('Error downloading HTML:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to download map'
    });
  }
});

export default router;
