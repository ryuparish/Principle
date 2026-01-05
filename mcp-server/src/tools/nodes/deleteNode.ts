import { z } from 'zod';
import { deleteNodeSchema } from '../../schemas/tools.js';
import { NodeService } from '../../services/NodeService.js';
import { logger } from '../../config/logging.js';

export async function handleDeleteNode(
  args: unknown,
  nodeService: NodeService
) {
  try {
    const validated = deleteNodeSchema.parse(args);

    // Get node info before deleting for the response message
    const node = await nodeService.getNodeById(validated.nodeId);
    if (!node) {
      return {
        content: [{
          type: 'text' as const,
          text: `Node ${validated.nodeId} not found`
        }],
        isError: true
      };
    }

    await nodeService.deleteNode(validated.nodeId);

    logger.info('Node deleted via MCP', { nodeId: validated.nodeId });

    return {
      content: [
        {
          type: 'text' as const,
          text: `✓ Deleted node "${node.title}" (ID: ${validated.nodeId})`
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

    logger.error('Failed to delete node via MCP', error);
    throw error;
  }
}
