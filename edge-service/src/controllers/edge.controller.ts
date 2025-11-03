import { Request, Response } from 'express';
import { edgeService } from '../services/edge.service';

export class EdgeController {
  async getByMindmap(req: Request, res: Response) {
    try {
      const { mindmapId } = req.query;

      if (!mindmapId || typeof mindmapId !== 'string') {
        return res.status(400).json({ error: 'mindmapId query parameter is required' });
      }

      const edges = await edgeService.getEdgesByMindmap(mindmapId);
      res.json({ edges });
    } catch (error) {
      console.error('Error fetching edges:', error);
      res.status(500).json({ error: 'Failed to fetch edges' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const edge = await edgeService.getEdgeById(id);

      if (!edge) {
        return res.status(404).json({ error: 'Edge not found' });
      }

      res.json(edge);
    } catch (error) {
      console.error('Error fetching edge:', error);
      res.status(500).json({ error: 'Failed to fetch edge' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { mindmapId, sourceNodeId, targetNodeId, label, style } = req.body;

      // Validation
      if (!mindmapId) {
        return res.status(400).json({ error: 'mindmapId is required' });
      }
      if (!sourceNodeId) {
        return res.status(400).json({ error: 'sourceNodeId is required' });
      }
      if (!targetNodeId) {
        return res.status(400).json({ error: 'targetNodeId is required' });
      }

      const edge = await edgeService.createEdge({
        mindmapId,
        sourceNodeId,
        targetNodeId,
        label,
        style
      });

      res.status(201).json(edge);
    } catch (error) {
      console.error('Error creating edge:', error);
      res.status(500).json({ error: 'Failed to create edge' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { label, style } = req.body;

      const edge = await edgeService.updateEdge(id, {
        label,
        style
      });

      res.json(edge);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Edge not found' });
      }
      console.error('Error updating edge:', error);
      res.status(500).json({ error: 'Failed to update edge' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await edgeService.deleteEdge(id);
      res.json({ success: true, message: 'Edge deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Edge not found' });
      }
      console.error('Error deleting edge:', error);
      res.status(500).json({ error: 'Failed to delete edge' });
    }
  }
}

export const edgeController = new EdgeController();
