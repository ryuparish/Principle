import { Router, Request, Response } from 'express';
import axios from 'axios';
import { services } from '../config/services.config';

const router = Router();

// Get all mindmaps
router.get('/', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${services.nodeService}/mindmaps`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching mindmaps:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch mindmaps'
    });
  }
});

// Create mindmap
router.post('/', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${services.nodeService}/mindmaps`, req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('Error creating mindmap:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to create mindmap'
    });
  }
});

// Import concept map from JSON
router.post('/import', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${services.nodeService}/mindmaps/import`, req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('Error importing concept map:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to import concept map'
    });
  }
});

// Get mindmap by ID (with nodes)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${services.nodeService}/mindmaps/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching mindmap:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch mindmap'
    });
  }
});

// Update mindmap
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.patch(`${services.nodeService}/mindmaps/${id}`, req.body);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error updating mindmap:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to update mindmap'
    });
  }
});

// Delete mindmap
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.delete(`${services.nodeService}/mindmaps/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error deleting mindmap:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to delete mindmap'
    });
  }
});

// Share management endpoints
// Enable sharing
router.post('/:id/share', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.post(`${services.nodeService}/mindmaps/${id}/share`, req.body);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error enabling sharing:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to enable sharing'
    });
  }
});

// Get share settings
router.get('/:id/share', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${services.nodeService}/mindmaps/${id}/share`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error getting share settings:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to get share settings'
    });
  }
});

// Disable sharing
router.delete('/:id/share', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.delete(`${services.nodeService}/mindmaps/${id}/share`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error disabling sharing:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to disable sharing'
    });
  }
});

export default router;
