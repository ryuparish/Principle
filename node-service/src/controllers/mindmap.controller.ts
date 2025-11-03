import { Request, Response } from 'express';
import { mindmapService } from '../services/mindmap.service';

export class MindmapController {
  async getAll(req: Request, res: Response) {
    try {
      const mindmaps = await mindmapService.getAllMindmaps();
      res.json({ mindmaps });
    } catch (error) {
      console.error('Error fetching mindmaps:', error);
      res.status(500).json({ error: 'Failed to fetch mindmaps' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const mindmap = await mindmapService.getMindmapById(id);

      if (!mindmap) {
        return res.status(404).json({ error: 'Mindmap not found' });
      }

      res.json(mindmap);
    } catch (error) {
      console.error('Error fetching mindmap:', error);
      res.status(500).json({ error: 'Failed to fetch mindmap' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, description } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const mindmap = await mindmapService.createMindmap({ name, description });
      res.status(201).json(mindmap);
    } catch (error) {
      console.error('Error creating mindmap:', error);
      res.status(500).json({ error: 'Failed to create mindmap' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, viewport } = req.body;

      const mindmap = await mindmapService.updateMindmap(id, {
        name,
        description,
        viewport
      });

      res.json(mindmap);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Mindmap not found' });
      }
      console.error('Error updating mindmap:', error);
      res.status(500).json({ error: 'Failed to update mindmap' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await mindmapService.deleteMindmap(id);
      res.json({ success: true, message: 'Mindmap deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Mindmap not found' });
      }
      console.error('Error deleting mindmap:', error);
      res.status(500).json({ error: 'Failed to delete mindmap' });
    }
  }
}

export const mindmapController = new MindmapController();
