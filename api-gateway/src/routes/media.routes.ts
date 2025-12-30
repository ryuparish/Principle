import { Router, Request, Response } from 'express';
import axios from 'axios';
import FormData from 'form-data';
import multer from 'multer';
import { services } from '../config/services.config';

const router = Router();

// Configure multer for memory storage (we'll forward to media service)
const upload = multer({ storage: multer.memoryStorage() });

// Upload media
router.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create FormData for forwarding to media service
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Add nodeId if present
    if (req.body.nodeId) {
      formData.append('nodeId', req.body.nodeId);
    }

    // Forward to media service
    const response = await axios.post(`${services.mediaService}/upload`, formData, {
      headers: formData.getHeaders()
    });

    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('Error uploading media:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });

    // Detect if media-service is down
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        error: 'Media service is unavailable',
        details: 'The media-service is not running on port 3003. Please start it with: npm run dev:media',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to upload media',
      details: error.message
    });
  }
});

// Get media by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${services.mediaService}/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching media:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch media'
    });
  }
});

// Serve file (stream through gateway)
router.get('/file/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const response = await axios.get(`${services.mediaService}/file/${filename}`, {
      responseType: 'stream'
    });

    // Forward content type
    if (response.headers['content-type']) {
      res.setHeader('content-type', response.headers['content-type']);
    }

    // Stream the file
    response.data.pipe(res);
  } catch (error: any) {
    console.error('Error serving file:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to serve file'
    });
  }
});

// Get media by node
router.get('/node/:nodeId', async (req: Request, res: Response) => {
  try {
    const { nodeId } = req.params;
    const response = await axios.get(`${services.mediaService}/node/${nodeId}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching media by node:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch media by node'
    });
  }
});

// Get media by IDs (bulk)
router.get('/bulk', async (req: Request, res: Response) => {
  try {
    const { ids } = req.query;
    const response = await axios.get(`${services.mediaService}/bulk`, {
      params: { ids }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching media bulk:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch media bulk'
    });
  }
});

// Delete media
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.delete(`${services.mediaService}/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error deleting media:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to delete media'
    });
  }
});

// Cleanup orphaned media
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${services.mediaService}/cleanup`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error cleaning up media:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to cleanup media'
    });
  }
});

export default router;
