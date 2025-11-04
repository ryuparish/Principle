import { Request, Response } from 'express';
import { conceptMapService } from '../services/mindmap.service';

export class ConceptMapController {
  async getAll(req: Request, res: Response) {
    try {
      const conceptMaps = await conceptMapService.getAllConceptMaps();

      // Parse JSON strings back to objects for client
      const parsedConceptMaps = conceptMaps.map(cm => ({
        ...cm,
        viewport: JSON.parse(cm.viewport as any)
      }));

      res.json({ mindmaps: parsedConceptMaps });
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

      // Parse JSON strings back to objects for client
      const parsedConceptMap = {
        ...conceptMap,
        viewport: JSON.parse(conceptMap.viewport as any),
        nodes: conceptMap.nodes?.map(node => ({
          ...node,
          position: JSON.parse(node.position as any),
          content: JSON.parse(node.content as any),
          style: JSON.parse(node.style as any),
          imageIds: JSON.parse(node.imageIds as any),
          tags: JSON.parse(node.tags as any)
        }))
      };

      res.json(parsedConceptMap);
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

      // Parse JSON strings back to objects for client
      const parsedConceptMap = {
        ...conceptMap,
        viewport: JSON.parse(conceptMap.viewport as any)
      };

      res.status(201).json(parsedConceptMap);
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

      // Parse JSON strings back to objects for client
      const parsedConceptMap = {
        ...conceptMap,
        viewport: JSON.parse(conceptMap.viewport as any)
      };

      res.json(parsedConceptMap);
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
