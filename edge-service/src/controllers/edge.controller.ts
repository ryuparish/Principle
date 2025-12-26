import { Request, Response } from 'express';
import { edgeService } from '../services/edge.service';

export class EdgeController {
  async getByConceptMap(req: Request, res: Response) {
    try {
      const { conceptMapId } = req.query;

      if (!conceptMapId || typeof conceptMapId !== 'string') {
        return res.status(400).json({ error: 'conceptMapId query parameter is required' });
      }

      const edges = await edgeService.getEdgesByConceptMap(conceptMapId);

      // TypeORM transformers already convert JSON strings to objects
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

      // TypeORM transformers already convert JSON strings to objects
      res.json(edge);
    } catch (error) {
      console.error('Error fetching edge:', error);
      res.status(500).json({ error: 'Failed to fetch edge' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { id, conceptMapId, sourceNodeId, targetNodeId, sourceHandleId, targetHandleId, label, style } = req.body;

      // Validation
      if (!conceptMapId) {
        return res.status(400).json({ error: 'conceptMapId is required' });
      }
      if (!sourceNodeId) {
        return res.status(400).json({ error: 'sourceNodeId is required' });
      }
      if (!targetNodeId) {
        return res.status(400).json({ error: 'targetNodeId is required' });
      }

      const edge = await edgeService.createEdge({
        id, // Pass ID to service (optional, for undo/redo)
        conceptMapId,
        sourceNodeId,
        targetNodeId,
        sourceHandleId,
        targetHandleId,
        label,
        style
      });

      // TypeORM transformers already convert JSON strings to objects
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

      // TypeORM transformers already convert JSON strings to objects
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
