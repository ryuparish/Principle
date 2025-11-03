import { Request, Response } from 'express';
import { nodeService } from '../services/node.service';

export class NodeController {
  async getByMindmap(req: Request, res: Response) {
    try {
      const { mindmapId } = req.query;

      if (!mindmapId || typeof mindmapId !== 'string') {
        return res.status(400).json({ error: 'mindmapId query parameter is required' });
      }

      const nodes = await nodeService.getNodesByMindmap(mindmapId);
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

      res.json(node);
    } catch (error) {
      console.error('Error fetching node:', error);
      res.status(500).json({ error: 'Failed to fetch node' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { mindmapId, title, content, position, style } = req.body;

      // Validation
      if (!mindmapId) {
        return res.status(400).json({ error: 'mindmapId is required' });
      }
      if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: 'title is required' });
      }
      if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
        return res.status(400).json({ error: 'position with x and y coordinates is required' });
      }

      const node = await nodeService.createNode({
        mindmapId,
        title,
        content,
        position,
        style
      });

      res.status(201).json(node);
    } catch (error) {
      console.error('Error creating node:', error);
      res.status(500).json({ error: 'Failed to create node' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, content, position, style, imageIds, tags } = req.body;

      const node = await nodeService.updateNode(id, {
        title,
        content,
        position,
        style,
        imageIds,
        tags
      });

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

  async search(req: Request, res: Response) {
    try {
      const { mindmapId, q } = req.query;

      if (!mindmapId || typeof mindmapId !== 'string') {
        return res.status(400).json({ error: 'mindmapId query parameter is required' });
      }
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'q (query) parameter is required' });
      }

      const nodes = await nodeService.searchNodes(mindmapId, q);
      res.json({ results: nodes });
    } catch (error) {
      console.error('Error searching nodes:', error);
      res.status(500).json({ error: 'Failed to search nodes' });
    }
  }
}

export const nodeController = new NodeController();
