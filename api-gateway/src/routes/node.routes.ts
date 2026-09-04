import { Router, Request, Response } from 'express';
import axios from 'axios';
import { services } from '../config/services.config';

const router = Router();
const CORE = services.coreGraphService;

// Transform CORE node to Principle node format
function coreNodeToPrincipleNode(coreNode: any) {
  const metadata = coreNode.metadata || {};
  return {
    id: coreNode.id,
    conceptMapId: coreNode.container_id,
    title: coreNode.content || '',
    content: metadata.richContent || {},
    position: metadata.position || { x: 0, y: 0 },
    style: metadata.style || {},
    imageIds: metadata.imageIds || [],
    tags: metadata.tags || [],
    nodeType: coreNode.type || 'jot',
    isDeleted: false,
    createdAt: coreNode.created_at,
    updatedAt: coreNode.updated_at
  };
}

// Get nodes by concept map (container)
router.get('/', async (req: Request, res: Response) => {
  try {
    const containerId = req.query.conceptMapId || req.query.mindmapId;
    if (!containerId) {
      return res.status(400).json({ error: 'conceptMapId or mindmapId is required' });
    }

    const response = await axios.get(`${CORE}/api/v1/nodes`, {
      params: { container_id: containerId, limit: 1000 }
    });

    const coreNodes = response.data.nodes || [];
    const nodes = coreNodes.map(coreNodeToPrincipleNode);
    res.json({ nodes });
  } catch (error: any) {
    console.error('Error fetching nodes from CORE:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to fetch nodes'
    });
  }
});

// Search nodes via CORE fulltext search
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, conceptMapId, mindmapId } = req.query;
    const containerId = conceptMapId || mindmapId;

    const response = await axios.get(`${CORE}/api/v1/search/fulltext`, {
      params: {
        q,
        container_id: containerId,
        limit: 50
      }
    });

    const results = (response.data.results || []).map((r: any) =>
      coreNodeToPrincipleNode(r.node)
    );
    res.json({ results });
  } catch (error: any) {
    console.error('Error searching nodes in CORE:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to search nodes'
    });
  }
});

// Get node by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${CORE}/api/v1/nodes/${id}`);
    const node = coreNodeToPrincipleNode(response.data);
    res.json(node);
  } catch (error: any) {
    console.error('Error fetching node from CORE:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to fetch node'
    });
  }
});

// Create node
router.post('/', async (req: Request, res: Response) => {
  try {
    const { conceptMapId, title, position, content, style, nodeType } = req.body;

    const corePayload: any = {
      type: nodeType || 'jot',
      content: title || '',
      metadata: {
        position: position || { x: 0, y: 0 },
        style: style || {},
        richContent: content || {},
        imageIds: [],
        tags: []
      },
      container_id: conceptMapId
    };

    const response = await axios.post(`${CORE}/api/v1/nodes`, corePayload);
    const node = coreNodeToPrincipleNode(response.data);
    res.status(201).json(node);
  } catch (error: any) {
    console.error('Error creating node in CORE:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to create node'
    });
  }
});

// Update node (partial update with metadata merge)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, position, style, imageIds, tags } = req.body;

    // Fetch current node to merge metadata
    const currentRes = await axios.get(`${CORE}/api/v1/nodes/${id}`);
    const currentNode = currentRes.data;
    const currentMetadata = currentNode.metadata || {};

    // Build update payload - merge metadata fields
    const updatedMetadata = { ...currentMetadata };
    if (content !== undefined) updatedMetadata.richContent = content;
    if (position !== undefined) updatedMetadata.position = position;
    if (style !== undefined) updatedMetadata.style = style;
    if (imageIds !== undefined) updatedMetadata.imageIds = imageIds;
    if (tags !== undefined) updatedMetadata.tags = tags;

    const corePayload: any = { metadata: updatedMetadata };
    if (title !== undefined) corePayload.content = title;

    const response = await axios.put(`${CORE}/api/v1/nodes/${id}`, corePayload);
    const node = coreNodeToPrincipleNode(response.data);
    res.json(node);
  } catch (error: any) {
    console.error('Error updating node in CORE:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to update node'
    });
  }
});

// Delete node
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.delete(`${CORE}/api/v1/nodes/${id}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error deleting node in CORE:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to delete node'
    });
  }
});

export default router;
