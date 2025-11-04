import { Router, Request, Response } from 'express';
import axios from 'axios';
import { services } from '../config/services.config';

const router = Router();

// Get edges by concept map
router.get('/', async (req: Request, res: Response) => {
  try {
    const { conceptMapId } = req.query;
    const response = await axios.get(`${services.edgeService}/edges`, {
      params: { conceptMapId }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching edges:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch edges'
    });
  }
});

// Get edge by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${services.edgeService}/edges/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching edge:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch edge'
    });
  }
});

// Create edge
router.post('/', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${services.edgeService}/edges`, req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('Error creating edge:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to create edge'
    });
  }
});

// Update edge
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.patch(`${services.edgeService}/edges/${id}`, req.body);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error updating edge:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to update edge'
    });
  }
});

// Delete edge
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.delete(`${services.edgeService}/edges/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error deleting edge:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to delete edge'
    });
  }
});

export default router;
