import { z } from 'zod';
import { createNodeSchema } from '../../schemas/tools.js';
import { NodeService } from '../../services/NodeService.js';
import { logger } from '../../config/logging.js';

export async function handleCreateNode(
  args: unknown,
  nodeService: NodeService
) {
  try {
    const validated = createNodeSchema.parse(args);

    const node = await nodeService.createNode({
      conceptMapId: validated.mapId,
      title: validated.title,
      description: validated.description,
      position: validated.position,
      shape: validated.shape,
      tags: validated.tags
    });

    logger.info('Node created via MCP', { nodeId: node.id, title: node.title });

    return {
      content: [
        {
          type: 'text' as const,
          text: `✓ Created node "${node.title}" (ID: ${node.id}) at position (${node.position.x}, ${node.position.y})`
        }
      ]
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        content: [{
          type: 'text' as const,
          text: `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        }],
        isError: true
      };
    }

    logger.error('Failed to create node via MCP', error);
    throw error;
  }
}
