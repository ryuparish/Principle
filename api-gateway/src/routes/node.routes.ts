import { Router, Request, Response } from 'express';
import axios from 'axios';
import { services } from '../config/services.config';

const router = Router();

// Get nodes by mindmap
router.get('/', async (req: Request, res: Response) => {
  try {
    const { mindmapId } = req.query;
    const response = await axios.get(`${services.nodeService}/nodes`, {
      params: { mindmapId }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching nodes:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch nodes'
    });
  }
});

// Search nodes
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { mindmapId, q } = req.query;
    const response = await axios.get(`${services.nodeService}/nodes/search`, {
      params: { mindmapId, q }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error searching nodes:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to search nodes'
    });
  }
});

// Get node by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${services.nodeService}/nodes/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching node:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch node'
    });
  }
});

// Create node
router.post('/', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${services.nodeService}/nodes`, req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('Error creating node:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to create node'
    });
  }
});

// Update node
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.patch(`${services.nodeService}/nodes/${id}`, req.body);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error updating node:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to update node'
    });
  }
});

// Delete node
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.delete(`${services.nodeService}/nodes/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error deleting node:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to delete node'
    });
  }
});

export default router;
