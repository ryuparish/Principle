import { Router, Request, Response } from 'express';
import axios from 'axios';
import { services } from '../config/services.config';

const router = Router();

// GET /walks?conceptMapId=:id - List walks for a map
router.get('/', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${services.nodeService}/walks`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching walks:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch walks'
    });
  }
});

// GET /walks/:id - Get a single walk with steps
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${services.nodeService}/walks/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching walk:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch walk'
    });
  }
});

// POST /walks - Create a new walk
router.post('/', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${services.nodeService}/walks`, req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('Error creating walk:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to create walk'
    });
  }
});

// PATCH /walks/:id - Update walk metadata
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.patch(`${services.nodeService}/walks/${id}`, req.body);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error updating walk:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to update walk'
    });
  }
});

// DELETE /walks/:id - Delete a walk
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await axios.delete(`${services.nodeService}/walks/${id}`);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting walk:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to delete walk'
    });
  }
});

// PUT /walks/:id/steps/reorder - Reorder all steps (before :stepId route!)
router.put('/:id/steps/reorder', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.put(`${services.nodeService}/walks/${id}/steps/reorder`, req.body);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error reordering steps:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to reorder steps'
    });
  }
});

// POST /walks/:id/steps - Add a step to a walk
router.post('/:id/steps', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.post(`${services.nodeService}/walks/${id}/steps`, req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('Error adding step:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to add step'
    });
  }
});

// PATCH /walks/:id/steps/:stepId - Update a step
router.patch('/:id/steps/:stepId', async (req: Request, res: Response) => {
  try {
    const { id, stepId } = req.params;
    const response = await axios.patch(`${services.nodeService}/walks/${id}/steps/${stepId}`, req.body);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error updating step:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to update step'
    });
  }
});

// DELETE /walks/:id/steps/:stepId - Remove a step
router.delete('/:id/steps/:stepId', async (req: Request, res: Response) => {
  try {
    const { id, stepId } = req.params;
    await axios.delete(`${services.nodeService}/walks/${id}/steps/${stepId}`);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error removing step:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to remove step'
    });
  }
});

export default router;
