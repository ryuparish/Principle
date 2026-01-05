import { z } from 'zod';
import { updateNodeSchema } from '../../schemas/tools.js';
import { NodeService } from '../../services/NodeService.js';
import { logger } from '../../config/logging.js';

export async function handleUpdateNode(
  args: unknown,
  nodeService: NodeService
) {
  try {
    const validated = updateNodeSchema.parse(args);

    const node = await nodeService.updateNode(validated.nodeId, {
      title: validated.title,
      description: validated.description,
      position: validated.position,
      shape: validated.shape,
      tags: validated.tags
    });

    logger.info('Node updated via MCP', { nodeId: node.id });

    return {
      content: [
        {
          type: 'text' as const,
          text: `✓ Updated node "${node.title}" (ID: ${node.id})`
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

    if (error instanceof Error && error.message.includes('not found')) {
      return {
        content: [{
          type: 'text' as const,
          text: error.message
        }],
        isError: true
      };
    }

    logger.error('Failed to update node via MCP', error);
    throw error;
  }
}
