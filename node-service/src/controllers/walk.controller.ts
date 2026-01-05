import { Request, Response } from 'express';
import { walkService } from '../services/walk.service';

// GET /walks?conceptMapId=:id - List walks for a concept map
export const getWalks = async (req: Request, res: Response) => {
  try {
    const { conceptMapId } = req.query;

    if (!conceptMapId || typeof conceptMapId !== 'string') {
      return res.status(400).json({ error: 'conceptMapId query parameter is required' });
    }

    const walks = await walkService.getWalksByConceptMap(conceptMapId);
    res.json(walks);
  } catch (error: any) {
    console.error('Error fetching walks:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch walks' });
  }
};

// GET /walks/:id - Get a single walk with steps
export const getWalk = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const walk = await walkService.getWalkById(id);

    if (!walk) {
      return res.status(404).json({ error: 'Walk not found' });
    }

    res.json(walk);
  } catch (error: any) {
    console.error('Error fetching walk:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch walk' });
  }
};

// POST /walks - Create a new walk
export const createWalk = async (req: Request, res: Response) => {
  try {
    const { conceptMapId, name, description } = req.body;

    if (!conceptMapId) {
      return res.status(400).json({ error: 'conceptMapId is required' });
    }
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const walk = await walkService.createWalk({ conceptMapId, name, description });
    res.status(201).json(walk);
  } catch (error: any) {
    console.error('Error creating walk:', error);
    res.status(500).json({ error: error.message || 'Failed to create walk' });
  }
};

// PATCH /walks/:id - Update walk metadata
export const updateWalk = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const walk = await walkService.updateWalk(id, { name, description });
    res.json(walk);
  } catch (error: any) {
    console.error('Error updating walk:', error);
    if (error.message?.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to update walk' });
  }
};

// DELETE /walks/:id - Delete a walk
export const deleteWalk = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await walkService.deleteWalk(id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting walk:', error);
    if (error.message?.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to delete walk' });
  }
};

// POST /walks/:id/steps - Add a step to a walk
export const addStep = async (req: Request, res: Response) => {
  try {
    const { id: walkId } = req.params;
    const { nodeId, order, annotation, zoomLevel, duration } = req.body;

    if (!nodeId) {
      return res.status(400).json({ error: 'nodeId is required' });
    }
    if (order === undefined || order === null) {
      return res.status(400).json({ error: 'order is required' });
    }

    const step = await walkService.addStep(walkId, {
      nodeId,
      order,
      annotation,
      zoomLevel,
      duration
    });
    res.status(201).json(step);
  } catch (error: any) {
    console.error('Error adding step:', error);
    if (error.message?.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to add step' });
  }
};

// PATCH /walks/:id/steps/:stepId - Update a step
export const updateStep = async (req: Request, res: Response) => {
  try {
    const { stepId } = req.params;
    const { annotation, zoomLevel, duration, order } = req.body;

    const step = await walkService.updateStep(stepId, {
      annotation,
      zoomLevel,
      duration,
      order
    });
    res.json(step);
  } catch (error: any) {
    console.error('Error updating step:', error);
    if (error.message?.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to update step' });
  }
};

// DELETE /walks/:id/steps/:stepId - Remove a step
export const removeStep = async (req: Request, res: Response) => {
  try {
    const { stepId } = req.params;
    await walkService.removeStep(stepId);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error removing step:', error);
    if (error.message?.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to remove step' });
  }
};

// PUT /walks/:id/steps/reorder - Reorder all steps
export const reorderSteps = async (req: Request, res: Response) => {
  try {
    const { id: walkId } = req.params;
    const { stepIds } = req.body;

    if (!Array.isArray(stepIds)) {
      return res.status(400).json({ error: 'stepIds must be an array' });
    }

    const steps = await walkService.reorderSteps(walkId, stepIds);
    res.json(steps);
  } catch (error: any) {
    console.error('Error reordering steps:', error);
    if (error.message?.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to reorder steps' });
  }
};
