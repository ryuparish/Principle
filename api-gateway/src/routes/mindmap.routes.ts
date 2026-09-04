import { Router, Request, Response } from 'express';
import axios from 'axios';
import { services } from '../config/services.config';

const router = Router();
const CORE = services.coreGraphService;

// Transform CORE container to Principle ConceptMap format
function containerToConceptMap(container: any) {
  return {
    id: container.id,
    name: container.name,
    description: container.description || '',
    viewport: container.metadata?.viewport || { x: 0, y: 0, zoom: 1 },
    createdAt: container.created_at,
    updatedAt: container.updated_at
  };
}

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

// Get all concept maps (containers)
router.get('/', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${CORE}/api/v1/containers`, {
      params: { limit: 1000 }
    });
    const containers = response.data.containers || response.data || [];
    const mindmaps = (Array.isArray(containers) ? containers : []).map(containerToConceptMap);
    res.json({ mindmaps });
  } catch (error: any) {
    console.error('Error fetching containers from CORE:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to fetch concept maps'
    });
  }
});

// Get concept map by ID (with nodes)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch container and its nodes in parallel
    const [containerRes, nodesRes] = await Promise.all([
      axios.get(`${CORE}/api/v1/containers/${id}`),
      axios.get(`${CORE}/api/v1/nodes`, {
        params: { container_id: id, limit: 1000 }
      })
    ]);

    const conceptMap = containerToConceptMap(containerRes.data);
    const coreNodes = nodesRes.data.nodes || [];
    conceptMap.nodes = coreNodes.map(coreNodeToPrincipleNode);

    res.json(conceptMap);
  } catch (error: any) {
    console.error('Error fetching container from CORE:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to fetch concept map'
    });
  }
});

// Create concept map (container)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const response = await axios.post(`${CORE}/api/v1/containers`, {
      name,
      container_type: 'main',
      description: description || '',
      metadata: { viewport: { x: 0, y: 0, zoom: 1 } }
    });

    const conceptMap = containerToConceptMap(response.data);
    res.status(201).json(conceptMap);
  } catch (error: any) {
    console.error('Error creating container in CORE:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to create concept map'
    });
  }
});

// Update concept map - viewport updates are accepted but CORE containers don't have PUT
// We return success for client compatibility; viewport can be restored via fitView
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Fetch current container to return updated version
    const containerRes = await axios.get(`${CORE}/api/v1/containers/${id}`);
    const conceptMap = containerToConceptMap(containerRes.data);

    // Apply local updates from the request body
    if (req.body.name) conceptMap.name = req.body.name;
    if (req.body.description !== undefined) conceptMap.description = req.body.description;
    if (req.body.viewport) conceptMap.viewport = req.body.viewport;

    res.json(conceptMap);
  } catch (error: any) {
    console.error('Error updating container in CORE:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to update concept map'
    });
  }
});

// Delete concept map (container with cascade)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.delete(`${CORE}/api/v1/containers/${id}`, {
      params: { cascade: true }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error deleting container in CORE:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to delete concept map'
    });
  }
});

export default router;
