import { Router, Request, Response } from 'express';
import axios from 'axios';
import { services } from '../config/services.config';

const router = Router();
const CORE = services.coreGraphService;

// Transform CORE edge to Principle edge format
function coreEdgeToPrincipleEdge(coreEdge: any) {
  const metadata = coreEdge.metadata || {};
  return {
    id: coreEdge.id,
    conceptMapId: metadata.conceptMapId || '',
    sourceNodeId: coreEdge.source_id,
    targetNodeId: coreEdge.target_id,
    label: coreEdge.relationship_type !== 'RELATES_TO' ? coreEdge.relationship_type : (metadata.label || ''),
    style: metadata.style || {},
    createdAt: coreEdge.created_at
  };
}

// Get edges by concept map
// Strategy: get all nodes in the container, then fetch edges for each node in parallel
router.get('/', async (req: Request, res: Response) => {
  try {
    const containerId = req.query.conceptMapId || req.query.mindmapId;
    if (!containerId) {
      return res.status(400).json({ error: 'conceptMapId is required' });
    }

    // Get all nodes in the container to find their IDs
    const nodesRes = await axios.get(`${CORE}/api/v1/nodes`, {
      params: { container_id: containerId, limit: 1000 }
    });
    const nodeIds = new Set((nodesRes.data.nodes || []).map((n: any) => n.id));

    if (nodeIds.size === 0) {
      return res.json({ edges: [] });
    }

    // Fetch edges for each node (by source_id) in parallel
    const edgePromises = Array.from(nodeIds).map((nodeId) =>
      axios.get(`${CORE}/api/v1/edges`, {
        params: { source_id: nodeId, limit: 1000 }
      }).catch(() => ({ data: { edges: [] } }))
    );

    const results = await Promise.all(edgePromises);

    // Collect all edges, deduplicate by ID, filter to edges within container
    const seenIds = new Set<string>();
    const edges: any[] = [];
    for (const result of results) {
      for (const edge of (result.data.edges || [])) {
        if (!seenIds.has(edge.id) && nodeIds.has(edge.target_id)) {
          seenIds.add(edge.id);
          edges.push(coreEdgeToPrincipleEdge(edge));
        }
      }
    }

    res.json({ edges });
  } catch (error: any) {
    console.error('Error fetching edges from CORE:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to fetch edges'
    });
  }
});

// Get edge by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${CORE}/api/v1/edges/${id}`);
    const edge = coreEdgeToPrincipleEdge(response.data);
    res.json(edge);
  } catch (error: any) {
    console.error('Error fetching edge from CORE:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to fetch edge'
    });
  }
});

// Create edge
router.post('/', async (req: Request, res: Response) => {
  try {
    const { conceptMapId, sourceNodeId, targetNodeId, label, style } = req.body;

    const corePayload = {
      source_id: sourceNodeId,
      target_id: targetNodeId,
      relationship_type: label || 'RELATES_TO',
      weight: 1.0,
      metadata: {
        conceptMapId: conceptMapId || '',
        label: label || '',
        style: style || {}
      }
    };

    const response = await axios.post(`${CORE}/api/v1/edges`, corePayload);
    const edge = coreEdgeToPrincipleEdge(response.data);
    res.status(201).json(edge);
  } catch (error: any) {
    console.error('Error creating edge in CORE:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to create edge'
    });
  }
});

// Update edge
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { label, style } = req.body;

    // Fetch current edge to merge metadata
    const currentRes = await axios.get(`${CORE}/api/v1/edges/${id}`);
    const currentEdge = currentRes.data;
    const currentMetadata = currentEdge.metadata || {};

    const corePayload: any = {
      metadata: {
        ...currentMetadata,
        ...(label !== undefined ? { label } : {}),
        ...(style !== undefined ? { style } : {})
      }
    };

    if (label !== undefined) {
      corePayload.relationship_type = label || 'RELATES_TO';
    }

    const response = await axios.put(`${CORE}/api/v1/edges/${id}`, corePayload);
    const edge = coreEdgeToPrincipleEdge(response.data);
    res.json(edge);
  } catch (error: any) {
    console.error('Error updating edge in CORE:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to update edge'
    });
  }
});

// Delete edge
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.delete(`${CORE}/api/v1/edges/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error deleting edge in CORE:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to delete edge'
    });
  }
});

export default router;
