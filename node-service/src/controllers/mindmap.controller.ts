import { Request, Response } from 'express';
import { conceptMapService } from '../services/mindmap.service';

export class ConceptMapController {
  async getAll(req: Request, res: Response) {
    try {
      const conceptMaps = await conceptMapService.getAllConceptMaps();
      // TypeORM transformers already convert JSON strings to objects
      res.json({ mindmaps: conceptMaps });
    } catch (error) {
      console.error('Error fetching concept maps:', error);
      res.status(500).json({ error: 'Failed to fetch concept maps' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const conceptMap = await conceptMapService.getConceptMapById(id);

      if (!conceptMap) {
        return res.status(404).json({ error: 'Concept map not found' });
      }

      // TypeORM transformers already convert JSON strings to objects
      res.json(conceptMap);
    } catch (error) {
      console.error('Error fetching concept map:', error);
      res.status(500).json({ error: 'Failed to fetch concept map' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, description } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const conceptMap = await conceptMapService.createConceptMap({ name, description });

      // TypeORM transformers already convert JSON strings to objects
      res.status(201).json(conceptMap);
    } catch (error) {
      console.error('Error creating concept map:', error);
      res.status(500).json({ error: 'Failed to create concept map' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, viewport } = req.body;

      const conceptMap = await conceptMapService.updateConceptMap(id, {
        name,
        description,
        viewport
      });

      // TypeORM transformers already convert JSON strings to objects
      res.json(conceptMap);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Concept map not found' });
      }
      console.error('Error updating concept map:', error);
      res.status(500).json({ error: 'Failed to update concept map' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await conceptMapService.deleteConceptMap(id);
      res.json({ success: true, message: 'Concept map deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Concept map not found' });
      }
      console.error('Error deleting concept map:', error);
      res.status(500).json({ error: 'Failed to delete concept map' });
    }
  }
}

export const conceptMapController = new ConceptMapController();
