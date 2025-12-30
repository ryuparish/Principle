import { Request, Response } from 'express';
import { nodeService } from '../services/node.service';

export class NodeController {
  async getByConceptMap(req: Request, res: Response) {
    try {
      // Accept both mindmapId (legacy client) and conceptMapId (new naming)
      const conceptMapId = (req.query.conceptMapId || req.query.mindmapId) as string;

      if (!conceptMapId) {
        return res.status(400).json({ error: 'conceptMapId query parameter is required' });
      }

      const nodes = await nodeService.getNodesByConceptMap(conceptMapId);

      // TypeORM transformers already convert JSON strings to objects
      res.json({ nodes });
    } catch (error) {
      console.error('Error fetching nodes:', error);
      res.status(500).json({ error: 'Failed to fetch nodes' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const node = await nodeService.getNodeById(id);

      if (!node) {
        return res.status(404).json({ error: 'Node not found' });
      }

      // TypeORM transformers already convert JSON strings to objects
      res.json(node);
    } catch (error) {
      console.error('Error fetching node:', error);
      res.status(500).json({ error: 'Failed to fetch node' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { conceptMapId, title, content, position, style, shape } = req.body;

      // Validation
      if (!conceptMapId) {
        return res.status(400).json({ error: 'conceptMapId is required' });
      }
      if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: 'title is required' });
      }
      if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
        return res.status(400).json({ error: 'position with x and y coordinates is required' });
      }

      const node = await nodeService.createNode({
        conceptMapId,
        title,
        content,
        position,
        style,
        shape
      });

      // TypeORM transformers already convert JSON strings to objects
      res.status(201).json(node);
    } catch (error) {
      console.error('Error creating node:', error);
      res.status(500).json({ error: 'Failed to create node' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, content, position, style, imageIds, tags, shape } = req.body;

      const node = await nodeService.updateNode(id, {
        title,
        content,
        position,
        style,
        imageIds,
        tags,
        shape
      });

      // TypeORM transformers already convert JSON strings to objects
      res.json(node);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Node not found' });
      }
      console.error('Error updating node:', error);
      res.status(500).json({ error: 'Failed to update node' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await nodeService.deleteNode(id);
      res.json({ success: true, message: 'Node deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Node not found' });
      }
      console.error('Error deleting node:', error);
      res.status(500).json({ error: 'Failed to delete node' });
    }
  }

  async undelete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const node = await nodeService.undeleteNode(id);
      res.json(node);
    } catch (error: any) {
      if (error.message === 'Node not found after undelete') {
        return res.status(404).json({ error: 'Node not found' });
      }
      console.error('Error undeleting node:', error);
      res.status(500).json({ error: 'Failed to undelete node' });
    }
  }

  async search(req: Request, res: Response) {
    try {
      // Accept both mindmapId (legacy client) and conceptMapId (new naming)
      const conceptMapId = (req.query.conceptMapId || req.query.mindmapId) as string;
      const { q } = req.query;

      if (!conceptMapId) {
        return res.status(400).json({ error: 'conceptMapId query parameter is required' });
      }
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'q (query) parameter is required' });
      }

      const nodes = await nodeService.searchNodes(conceptMapId, q);

      // TypeORM transformers already convert JSON strings to objects
      res.json({ results: nodes });
    } catch (error) {
      console.error('Error searching nodes:', error);
      res.status(500).json({ error: 'Failed to search nodes' });
    }
  }
}

export const nodeController = new NodeController();
