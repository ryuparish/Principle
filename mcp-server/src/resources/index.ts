import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ConceptMapService } from '../services/ConceptMapService.js';
import { NodeService } from '../services/NodeService.js';
import { logger } from '../config/logging.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

export function registerResources(
  server: Server,
  mapService: ConceptMapService,
  nodeService: NodeService
) {
  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    logger.debug('Listing resources');

    // Get all maps to create dynamic resource list
    const maps = await mapService.getAllMaps();

    const resources = [
      {
        uri: 'conceptmap://maps',
        name: 'All Concept Maps',
        description: 'List of all concept maps with metadata and node counts',
        mimeType: 'application/json'
      },
      // Add individual map resources
      ...maps.map(map => ({
        uri: `conceptmap://map/${map.id}`,
        name: `Map: ${map.name}`,
        description: map.description || `Concept map with ${map.nodes?.length || 0} nodes`,
        mimeType: 'application/json'
      }))
    ];

    return { resources };
  });

  // Read resource content
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    logger.debug('Reading resource', { uri });

    // conceptmap://maps - List all maps
    if (uri === 'conceptmap://maps') {
      const maps = await mapService.getAllMaps();

      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            totalMaps: maps.length,
            maps: maps.map(m => ({
              id: m.id,
              name: m.name,
              description: m.description,
              nodeCount: m.nodes?.length || 0,
              viewport: m.viewport,
              createdAt: m.createdAt,
              updatedAt: m.updatedAt
            }))
          }, null, 2)
        }]
      };
    }

    // conceptmap://map/{mapId} - Get specific map with all nodes
    const mapMatch = uri.match(/^conceptmap:\/\/map\/([a-f0-9-]+)$/);
    if (mapMatch) {
      const mapId = mapMatch[1];
      const map = await mapService.getMapById(mapId);

      if (!map) {
        throw new Error(`Concept map ${mapId} not found`);
      }

      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            id: map.id,
            name: map.name,
            description: map.description,
            viewport: map.viewport,
            createdAt: map.createdAt,
            updatedAt: map.updatedAt,
            nodeCount: map.nodes?.length || 0,
            nodes: map.nodes?.map(n => ({
              id: n.id,
              title: n.title,
              content: n.content,
              position: n.position,
              shape: n.shape,
              tags: n.tags,
              nodeType: n.nodeType,
              portalTargetMapId: n.portalTargetMapId,
              portalTargetNodeId: n.portalTargetNodeId,
              createdAt: n.createdAt,
              updatedAt: n.updatedAt
            })) || []
          }, null, 2)
        }]
      };
    }

    // conceptmap://node/{nodeId} - Get specific node
    const nodeMatch = uri.match(/^conceptmap:\/\/node\/([a-f0-9-]+)$/);
    if (nodeMatch) {
      const nodeId = nodeMatch[1];
      const node = await nodeService.getNodeById(nodeId);

      if (!node) {
        throw new Error(`Node ${nodeId} not found`);
      }

      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            id: node.id,
            conceptMapId: node.conceptMapId,
            title: node.title,
            content: node.content,
            position: node.position,
            style: node.style,
            shape: node.shape,
            tags: node.tags,
            nodeType: node.nodeType,
            portalTargetMapId: node.portalTargetMapId,
            portalTargetNodeId: node.portalTargetNodeId,
            createdAt: node.createdAt,
            updatedAt: node.updatedAt
          }, null, 2)
        }]
      };
    }

    // conceptmap://analytics/{mapId} - Get map statistics
    const analyticsMatch = uri.match(/^conceptmap:\/\/analytics\/([a-f0-9-]+)$/);
    if (analyticsMatch) {
      const mapId = analyticsMatch[1];
      const stats = await mapService.getMapStatistics(mapId);

      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(stats, null, 2)
        }]
      };
    }

    logger.warn('Unknown resource URI', { uri });
    throw new Error(`Unknown resource URI: ${uri}`);
  });
}
