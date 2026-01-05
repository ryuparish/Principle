import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ConceptMapService } from '../services/ConceptMapService.js';
import { NodeService } from '../services/NodeService.js';
import { EdgeService } from '../services/EdgeService.js';
import { LayoutService } from '../services/LayoutService.js';
import { MediaService } from '../services/MediaService.js';
import { DriveService } from '../services/DriveService.js';
import { WalkService } from '../services/WalkService.js';
import { handleUploadImage } from './media/uploadImage.js';
import { handleFetchImageFromUrl } from './media/fetchImageFromUrl.js';
import { handleGetNodeImages } from './media/getNodeImages.js';
import { handleDeleteImage } from './media/deleteImage.js';
import { handleCreateMap } from './conceptMaps/createMap.js';
import { handleUpdateMap } from './conceptMaps/updateMap.js';
import { handleDeleteMap } from './conceptMaps/deleteMap.js';
import { handleCreateNode } from './nodes/createNode.js';
import { handleBatchCreateNodes } from './nodes/batchCreateNodes.js';
import { handleUpdateNode } from './nodes/updateNode.js';
import { handleBatchUpdateNodes } from './nodes/batchUpdateNodes.js';
import { handleDeleteNode } from './nodes/deleteNode.js';
import { handleSearchNodes } from './nodes/searchNodes.js';
import { handleCreateEdge } from './edges/createEdge.js';
import { handleBatchCreateEdges } from './edges/batchCreateEdges.js';
import { handleUpdateEdge } from './edges/updateEdge.js';
import { handleDeleteEdge } from './edges/deleteEdge.js';
import { handleGetEdges } from './edges/getEdges.js';
import { handleAutoLayout } from './layout/autoLayout.js';
import { handleAttachDriveFile } from './drive/attachDriveFile.js';
import { handleListDriveAttachments } from './drive/listDriveAttachments.js';
import { handleRemoveDriveFile } from './drive/removeDriveFile.js';
import { handleCreateWalk } from './walks/createWalk.js';
import { handleUpdateWalk } from './walks/updateWalk.js';
import { handleDeleteWalk } from './walks/deleteWalk.js';
import { handleGetWalk } from './walks/getWalk.js';
import { handleListWalks } from './walks/listWalks.js';
import { handleAddStep } from './walks/addStep.js';
import { handleUpdateStep } from './walks/updateStep.js';
import { handleRemoveStep } from './walks/removeStep.js';
import { handleReorderSteps } from './walks/reorderSteps.js';
import { logger } from '../config/logging.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

export function registerTools(
  server: Server,
  mapService: ConceptMapService,
  nodeService: NodeService,
  edgeService: EdgeService,
  layoutService: LayoutService,
  mediaService: MediaService,
  driveService: DriveService,
  walkService: WalkService
) {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Listing tools');

    return {
      tools: [
        // Concept Map Tools
        {
          name: 'create_concept_map',
          description: 'Create a new concept map for organizing ideas visually. Use this when the user wants to start a new map or diagram for brainstorming, planning, or knowledge organization.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              name: {
                type: 'string',
                description: 'Name of the concept map'
              },
              description: {
                type: 'string',
                description: 'Optional description of the map\'s purpose'
              }
            },
            required: ['name']
          }
        },
        {
          name: 'update_concept_map',
          description: 'Update an existing concept map\'s name, description, or viewport settings.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              mapId: {
                type: 'string',
                description: 'UUID of the concept map to update'
              },
              name: {
                type: 'string',
                description: 'New name for the map'
              },
              description: {
                type: 'string',
                description: 'New description for the map'
              },
              viewport: {
                type: 'object',
                description: 'Viewport settings (x, y, zoom)',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  zoom: { type: 'number' }
                }
              }
            },
            required: ['mapId']
          }
        },
        {
          name: 'delete_concept_map',
          description: 'Delete a concept map and all its nodes. This action cannot be undone.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              mapId: {
                type: 'string',
                description: 'UUID of the concept map to delete'
              }
            },
            required: ['mapId']
          }
        },

        // Node Tools
        {
          name: 'create_node',
          description: 'Create a single node (concept) in a concept map. Nodes represent ideas, concepts, or entities.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              mapId: {
                type: 'string',
                description: 'UUID of the concept map to add the node to'
              },
              title: {
                type: 'string',
                description: 'Title/label of the node'
              },
              description: {
                type: 'string',
                description: 'Optional description or notes for the node'
              },
              position: {
                type: 'object',
                description: 'Position on the canvas (x, y coordinates)',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' }
                }
              },
              shape: {
                type: 'string',
                description: 'Visual shape: rounded-rectangle, rectangle, circle, diamond, hexagon, parallelogram, cylinder, cloud, actor, document, queue, storage, portal',
                enum: ['rounded-rectangle', 'rectangle', 'circle', 'diamond', 'hexagon', 'parallelogram', 'cylinder', 'cloud', 'actor', 'document', 'queue', 'storage', 'portal']
              },
              tags: {
                type: 'array',
                description: 'Tags for categorization',
                items: { type: 'string' }
              }
            },
            required: ['mapId', 'title']
          }
        },
        {
          name: 'batch_create_nodes',
          description: 'Create multiple nodes at once in a concept map. Can optionally include edges between nodes (referenced by array index) and apply automatic force-directed layout to minimize edge crossings. Maximum 50 nodes per batch.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              mapId: {
                type: 'string',
                description: 'UUID of the concept map'
              },
              nodes: {
                type: 'array',
                description: 'Array of nodes to create',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: 'Node title' },
                    description: { type: 'string', description: 'Optional description' },
                    position: {
                      type: 'object',
                      properties: {
                        x: { type: 'number' },
                        y: { type: 'number' }
                      }
                    },
                    shape: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['title']
                }
              },
              edges: {
                type: 'array',
                description: 'Optional edges to create between nodes. Use array indices to reference source and target nodes. When provided, auto-layout will be applied.',
                items: {
                  type: 'object',
                  properties: {
                    sourceIndex: { type: 'number', description: 'Index of source node in nodes array' },
                    targetIndex: { type: 'number', description: 'Index of target node in nodes array' },
                    label: { type: 'string', description: 'Optional edge label' },
                    style: { type: 'object', description: 'Edge styling options' }
                  },
                  required: ['sourceIndex', 'targetIndex']
                }
              },
              autoLayout: {
                type: 'boolean',
                description: 'Force auto-layout even when no edges provided (default: true when edges are provided)'
              },
              layoutOptions: {
                type: 'object',
                description: 'Layout algorithm options',
                properties: {
                  width: { type: 'number', description: 'Canvas width (default: 2000)' },
                  height: { type: 'number', description: 'Canvas height (default: 1500)' },
                  repulsionStrength: { type: 'number', description: 'Node repulsion force, negative (default: -400)' },
                  linkDistance: { type: 'number', description: 'Target distance between connected nodes (default: 150)' },
                  collisionRadius: { type: 'number', description: 'Minimum spacing between nodes (default: 80)' }
                }
              }
            },
            required: ['mapId', 'nodes']
          }
        },
        {
          name: 'update_node',
          description: 'Update an existing node\'s title, description, position, shape, or tags.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              nodeId: {
                type: 'string',
                description: 'UUID of the node to update'
              },
              title: { type: 'string' },
              description: { type: 'string' },
              position: {
                type: 'object',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' }
                }
              },
              shape: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } }
            },
            required: ['nodeId']
          }
        },
        {
          name: 'batch_update_nodes',
          description: 'Update multiple nodes at once. Maximum 50 updates per batch. Useful for repositioning multiple nodes or bulk updating properties.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              updates: {
                type: 'array',
                description: 'Array of node updates to apply',
                items: {
                  type: 'object',
                  properties: {
                    nodeId: { type: 'string', description: 'UUID of the node to update' },
                    title: { type: 'string', description: 'New title' },
                    description: { type: 'string', description: 'New description' },
                    position: {
                      type: 'object',
                      properties: {
                        x: { type: 'number' },
                        y: { type: 'number' }
                      }
                    },
                    shape: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['nodeId']
                }
              }
            },
            required: ['updates']
          }
        },
        {
          name: 'delete_node',
          description: 'Delete a node from a concept map. The node is soft-deleted and can potentially be restored.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              nodeId: {
                type: 'string',
                description: 'UUID of the node to delete'
              }
            },
            required: ['nodeId']
          }
        },
        {
          name: 'search_nodes',
          description: 'Search for nodes by title within a concept map. Returns up to 20 matching nodes.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              mapId: {
                type: 'string',
                description: 'UUID of the concept map to search in'
              },
              query: {
                type: 'string',
                description: 'Search query (matches node titles)'
              }
            },
            required: ['mapId', 'query']
          }
        },

        // Edge Tools
        {
          name: 'create_edge',
          description: 'Create a connection (edge) between two nodes in a concept map. Edges represent relationships between concepts.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              mapId: {
                type: 'string',
                description: 'UUID of the concept map'
              },
              sourceNodeId: {
                type: 'string',
                description: 'UUID of the source node (where the edge starts)'
              },
              targetNodeId: {
                type: 'string',
                description: 'UUID of the target node (where the edge ends)'
              },
              label: {
                type: 'string',
                description: 'Optional text label to display on the edge'
              },
              style: {
                type: 'object',
                description: 'Visual styling for the edge',
                properties: {
                  stroke: { type: 'string', description: 'Edge color (e.g., #ff0000)' },
                  strokeWidth: { type: 'number', description: 'Line thickness (1-10)' },
                  animated: { type: 'boolean', description: 'Whether to animate the edge' },
                  type: { type: 'string', enum: ['default', 'straight', 'step', 'smoothstep', 'bezier'], description: 'Edge path type' }
                }
              }
            },
            required: ['mapId', 'sourceNodeId', 'targetNodeId']
          }
        },
        {
          name: 'batch_create_edges',
          description: 'Create multiple edges at once between nodes in a concept map. Maximum 100 edges per batch. Useful for quickly connecting many nodes.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              mapId: {
                type: 'string',
                description: 'UUID of the concept map'
              },
              edges: {
                type: 'array',
                description: 'Array of edges to create',
                items: {
                  type: 'object',
                  properties: {
                    sourceNodeId: { type: 'string', description: 'UUID of source node' },
                    targetNodeId: { type: 'string', description: 'UUID of target node' },
                    label: { type: 'string', description: 'Edge label' },
                    style: { type: 'object' }
                  },
                  required: ['sourceNodeId', 'targetNodeId']
                }
              }
            },
            required: ['mapId', 'edges']
          }
        },
        {
          name: 'update_edge',
          description: 'Update an existing edge\'s label or styling.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              edgeId: {
                type: 'string',
                description: 'UUID of the edge to update'
              },
              label: { type: 'string', description: 'New label text' },
              style: {
                type: 'object',
                properties: {
                  stroke: { type: 'string' },
                  strokeWidth: { type: 'number' },
                  animated: { type: 'boolean' },
                  type: { type: 'string', enum: ['default', 'straight', 'step', 'smoothstep', 'bezier'] }
                }
              }
            },
            required: ['edgeId']
          }
        },
        {
          name: 'delete_edge',
          description: 'Delete an edge (connection) between two nodes.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              edgeId: {
                type: 'string',
                description: 'UUID of the edge to delete'
              }
            },
            required: ['edgeId']
          }
        },
        {
          name: 'get_edges',
          description: 'Get all edges in a concept map. Returns a list of all connections between nodes.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              mapId: {
                type: 'string',
                description: 'UUID of the concept map'
              }
            },
            required: ['mapId']
          }
        },

        // Layout Tools
        {
          name: 'auto_layout',
          description: 'Apply force-directed layout to reposition all nodes in a concept map based on their edge connections. Connected nodes will be placed closer together, and the layout minimizes edge crossings for better readability. Use this to fix messy or overlapping node arrangements.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              mapId: {
                type: 'string',
                description: 'UUID of the concept map to layout'
              },
              options: {
                type: 'object',
                description: 'Optional layout configuration',
                properties: {
                  width: { type: 'number', description: 'Canvas width (default: 8000)' },
                  height: { type: 'number', description: 'Canvas height (default: 6000)' },
                  repulsionStrength: { type: 'number', description: 'Node repulsion force, negative values push nodes apart (default: -5000)' },
                  linkDistance: { type: 'number', description: 'Target distance between connected nodes (default: 600)' },
                  collisionRadius: { type: 'number', description: 'Minimum spacing between nodes to prevent overlap (default: 300)' },
                  iterations: { type: 'number', description: 'Simulation iterations, more = more stable but slower (default: 600)' },
                  pinnedNodeIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Node IDs that should not be moved during layout'
                  },
                  minimizeCrossings: {
                    type: 'boolean',
                    description: 'Enable edge crossing minimization using simulated annealing post-processing (default: false)'
                  },
                  crossingOptions: {
                    type: 'object',
                    description: 'Simulated annealing tuning parameters for crossing minimization',
                    properties: {
                      initialTemperature: { type: 'number', description: 'Starting temperature (default: 100)' },
                      coolingRate: { type: 'number', description: 'Temperature multiplier per iteration (default: 0.995)' },
                      maxIterations: { type: 'number', description: 'Maximum optimization iterations (default: 5000)' },
                      moveRadius: { type: 'number', description: 'Maximum distance to move a node per iteration (default: 50)' }
                    }
                  }
                }
              }
            },
            required: ['mapId']
          }
        },

        // Media Tools
        {
          name: 'upload_image',
          description: 'Upload an image to attach to a node. Provide either base64-encoded image data, a local file path, or a URL. The image will be stored and a thumbnail will be generated.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              nodeId: {
                type: 'string',
                description: 'UUID of the node to attach the image to'
              },
              base64Data: {
                type: 'string',
                description: 'Base64-encoded image data (PNG, JPEG, GIF, or WebP)'
              },
              filePath: {
                type: 'string',
                description: 'Local file path to an image file'
              },
              originalName: {
                type: 'string',
                description: 'Original filename (required when using base64Data)'
              }
            },
            required: ['nodeId']
          }
        },
        {
          name: 'fetch_image_from_url',
          description: 'Download an image from a web URL and attach it to a node. Supports JPEG, PNG, GIF, and WebP formats. Maximum file size is 10MB. Timeout is 30 seconds.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              nodeId: {
                type: 'string',
                description: 'UUID of the node to attach the image to'
              },
              url: {
                type: 'string',
                description: 'HTTP or HTTPS URL of the image to download'
              },
              originalName: {
                type: 'string',
                description: 'Optional override for the image filename'
              }
            },
            required: ['nodeId', 'url']
          }
        },
        {
          name: 'get_node_images',
          description: 'Get all images attached to a specific node. Returns image metadata including dimensions, size, and URLs.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              nodeId: {
                type: 'string',
                description: 'UUID of the node to get images for'
              }
            },
            required: ['nodeId']
          }
        },
        {
          name: 'delete_image',
          description: 'Delete an image from a node. This removes the image file and its thumbnail.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              imageId: {
                type: 'string',
                description: 'UUID of the image to delete'
              }
            },
            required: ['imageId']
          }
        },

        // Google Drive Tools
        {
          name: 'attach_drive_file',
          description: 'Attach a Google Drive file to a node. The file remains in Drive - only metadata is stored.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              nodeId: {
                type: 'string',
                description: 'UUID of the node to attach the file to'
              },
              fileId: {
                type: 'string',
                description: 'Google Drive file ID'
              },
              name: {
                type: 'string',
                description: 'File name'
              },
              mimeType: {
                type: 'string',
                description: 'MIME type (e.g., application/vnd.google-apps.document)'
              },
              iconUrl: {
                type: 'string',
                description: 'URL to the file type icon'
              },
              thumbnailUrl: {
                type: 'string',
                description: 'URL to the file thumbnail'
              },
              webViewLink: {
                type: 'string',
                description: 'URL to open the file in Drive'
              },
              size: {
                type: 'number',
                description: 'File size in bytes'
              }
            },
            required: ['nodeId', 'fileId', 'name', 'mimeType']
          }
        },
        {
          name: 'list_drive_attachments',
          description: 'List all Google Drive files attached to a node.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              nodeId: {
                type: 'string',
                description: 'UUID of the node to list attachments for'
              }
            },
            required: ['nodeId']
          }
        },
        {
          name: 'remove_drive_file',
          description: 'Remove a Google Drive file attachment from a node. The file remains in Drive.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              nodeId: {
                type: 'string',
                description: 'UUID of the node to remove the attachment from'
              },
              fileId: {
                type: 'string',
                description: 'Google Drive file ID to remove'
              }
            },
            required: ['nodeId', 'fileId']
          }
        },

        // Walk Tools
        {
          name: 'create_walk',
          description: 'Create a new walk (presentation sequence) for a concept map. Walks allow you to create guided tours through nodes with annotations and custom zoom levels.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              mapId: {
                type: 'string',
                description: 'UUID of the concept map'
              },
              name: {
                type: 'string',
                description: 'Name of the walk'
              },
              description: {
                type: 'string',
                description: 'Optional description of the walk'
              }
            },
            required: ['mapId', 'name']
          }
        },
        {
          name: 'update_walk',
          description: 'Update a walk\'s name or description.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              walkId: {
                type: 'string',
                description: 'UUID of the walk to update'
              },
              name: {
                type: 'string',
                description: 'New name for the walk'
              },
              description: {
                type: 'string',
                description: 'New description for the walk'
              }
            },
            required: ['walkId']
          }
        },
        {
          name: 'delete_walk',
          description: 'Delete a walk and all its steps.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              walkId: {
                type: 'string',
                description: 'UUID of the walk to delete'
              }
            },
            required: ['walkId']
          }
        },
        {
          name: 'get_walk',
          description: 'Get a walk with all its steps. Returns walk metadata and step details including annotations and zoom levels.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              walkId: {
                type: 'string',
                description: 'UUID of the walk to retrieve'
              }
            },
            required: ['walkId']
          }
        },
        {
          name: 'list_walks',
          description: 'List all walks for a concept map.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              mapId: {
                type: 'string',
                description: 'UUID of the concept map'
              }
            },
            required: ['mapId']
          }
        },
        {
          name: 'add_walk_step',
          description: 'Add a node as a step to a walk. Steps can have annotations, custom zoom levels, and auto-advance durations.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              walkId: {
                type: 'string',
                description: 'UUID of the walk'
              },
              nodeId: {
                type: 'string',
                description: 'UUID of the node to add as a step'
              },
              order: {
                type: 'number',
                description: 'Position in the walk (0-indexed). If not specified, appends to end.'
              },
              annotation: {
                type: 'string',
                description: 'Text annotation to display during this step'
              },
              zoomLevel: {
                type: 'number',
                description: 'Zoom level for this step (0.1-5, default: 1.5)'
              },
              duration: {
                type: 'number',
                description: 'Auto-advance duration in milliseconds (optional)'
              }
            },
            required: ['walkId', 'nodeId']
          }
        },
        {
          name: 'update_walk_step',
          description: 'Update a walk step\'s annotation, zoom level, duration, or order.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              stepId: {
                type: 'string',
                description: 'UUID of the step to update'
              },
              annotation: {
                type: 'string',
                description: 'New annotation text'
              },
              zoomLevel: {
                type: 'number',
                description: 'New zoom level (0.1-5)'
              },
              duration: {
                type: 'number',
                description: 'New auto-advance duration in milliseconds'
              },
              order: {
                type: 'number',
                description: 'New position in the walk'
              }
            },
            required: ['stepId']
          }
        },
        {
          name: 'remove_walk_step',
          description: 'Remove a step from a walk.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              stepId: {
                type: 'string',
                description: 'UUID of the step to remove'
              }
            },
            required: ['stepId']
          }
        },
        {
          name: 'reorder_walk_steps',
          description: 'Reorder all steps in a walk by providing step IDs in the new order.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              walkId: {
                type: 'string',
                description: 'UUID of the walk'
              },
              stepIds: {
                type: 'array',
                description: 'Array of step IDs in the desired order',
                items: { type: 'string' }
              }
            },
            required: ['walkId', 'stepIds']
          }
        }
      ]
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    logger.debug('Tool called', { name, args });

    switch (name) {
      // Concept Map Tools
      case 'create_concept_map':
        return await handleCreateMap(args, mapService);

      case 'update_concept_map':
        return await handleUpdateMap(args, mapService);

      case 'delete_concept_map':
        return await handleDeleteMap(args, mapService);

      // Node Tools
      case 'create_node':
        return await handleCreateNode(args, nodeService);

      case 'batch_create_nodes':
        return await handleBatchCreateNodes(args, nodeService, edgeService, layoutService);

      case 'update_node':
        return await handleUpdateNode(args, nodeService);

      case 'batch_update_nodes':
        return await handleBatchUpdateNodes(args, nodeService);

      case 'delete_node':
        return await handleDeleteNode(args, nodeService);

      case 'search_nodes':
        return await handleSearchNodes(args, nodeService);

      // Edge Tools
      case 'create_edge':
        return await handleCreateEdge(args, edgeService);

      case 'batch_create_edges':
        return await handleBatchCreateEdges(args, edgeService);

      case 'update_edge':
        return await handleUpdateEdge(args, edgeService);

      case 'delete_edge':
        return await handleDeleteEdge(args, edgeService);

      case 'get_edges':
        return await handleGetEdges(args, edgeService);

      // Layout Tools
      case 'auto_layout':
        return await handleAutoLayout(args, layoutService);

      // Media Tools
      case 'upload_image':
        return await handleUploadImage(args, mediaService);

      case 'fetch_image_from_url':
        return await handleFetchImageFromUrl(args, mediaService);

      case 'get_node_images':
        return await handleGetNodeImages(args, mediaService);

      case 'delete_image':
        return await handleDeleteImage(args, mediaService);

      // Drive Tools
      case 'attach_drive_file':
        return await handleAttachDriveFile(args, driveService);

      case 'list_drive_attachments':
        return await handleListDriveAttachments(args, driveService);

      case 'remove_drive_file':
        return await handleRemoveDriveFile(args, driveService);

      // Walk Tools
      case 'create_walk':
        return await handleCreateWalk(args, walkService);

      case 'update_walk':
        return await handleUpdateWalk(args, walkService);

      case 'delete_walk':
        return await handleDeleteWalk(args, walkService);

      case 'get_walk':
        return await handleGetWalk(args, walkService);

      case 'list_walks':
        return await handleListWalks(args, walkService);

      case 'add_walk_step':
        return await handleAddStep(args, walkService);

      case 'update_walk_step':
        return await handleUpdateStep(args, walkService);

      case 'remove_walk_step':
        return await handleRemoveStep(args, walkService);

      case 'reorder_walk_steps':
        return await handleReorderSteps(args, walkService);

      default:
        logger.warn('Unknown tool called', { name });
        return {
          content: [{
            type: 'text' as const,
            text: `Unknown tool: ${name}`
          }],
          isError: true
        };
    }
  });
}
