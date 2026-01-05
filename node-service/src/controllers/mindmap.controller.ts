import { Request, Response } from 'express';
import axios from 'axios';
import { conceptMapService } from '../services/mindmap.service';
import { shareService } from '../services/share.service';
import { nodeService } from '../services/node.service';
import { layoutService } from '../services/layout.service';

const EDGE_SERVICE_URL = process.env.EDGE_SERVICE_URL || 'http://localhost:3002';

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

  async export(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await shareService.exportMapById(id);

      const filename = `${data.map.name.replace(/[^a-z0-9]/gi, '-')}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(data);
    } catch (error: any) {
      console.error('Error exporting concept map:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Failed to export map' });
    }
  }

  async applyLayout(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const options = req.body || {};

      console.log(`[LAYOUT] Applying layout to map ${id}`, options);

      // Verify map exists
      const conceptMap = await conceptMapService.getConceptMapById(id);
      if (!conceptMap) {
        return res.status(404).json({ error: 'Concept map not found' });
      }

      // Get nodes
      const nodes = await nodeService.getNodesByConceptMap(id);
      if (nodes.length === 0) {
        return res.json({ nodes: [], message: 'No nodes to layout' });
      }

      // Get edges from edge-service
      let edges: any[] = [];
      try {
        const edgeResponse = await axios.get(`${EDGE_SERVICE_URL}/edges`, {
          params: { conceptMapId: id }
        });
        edges = edgeResponse.data.edges || [];
      } catch (error) {
        console.error('[LAYOUT] Failed to fetch edges:', error);
        // Continue without edges - layout will still work
      }

      console.log(`[LAYOUT] Found ${nodes.length} nodes and ${edges.length} edges`);

      // Calculate new layout using ELKjs
      const positions = await layoutService.calculateLayout(
        nodes.map(n => ({
          id: n.id,
          width: 180,
          height: 100
        })),
        edges.map((e: any) => ({
          id: e.id,
          sourceNodeId: e.sourceNodeId,
          targetNodeId: e.targetNodeId
        })),
        options
      );

      console.log(`[LAYOUT] Calculated positions for ${positions.size} nodes`);

      // Update node positions
      const updatedNodes = [];
      for (const node of nodes) {
        const newPos = positions.get(node.id);
        if (newPos) {
          const updated = await nodeService.updateNode(node.id, { position: newPos });
          updatedNodes.push(updated);
        } else {
          updatedNodes.push(node);
        }
      }

      console.log(`[LAYOUT] Updated ${updatedNodes.length} node positions`);

      res.json({ nodes: updatedNodes });
    } catch (error: any) {
      console.error('Error applying layout:', error);
      res.status(500).json({ error: error.message || 'Failed to apply layout' });
    }
  }
}

export const conceptMapController = new ConceptMapController();
