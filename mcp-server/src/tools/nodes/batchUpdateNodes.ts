import { z } from 'zod';
import { batchUpdateNodesSchema } from '../../schemas/tools.js';
import { NodeService } from '../../services/NodeService.js';
import { logger } from '../../config/logging.js';

export async function handleBatchUpdateNodes(
  args: unknown,
  nodeService: NodeService
) {
  try {
    const validated = batchUpdateNodesSchema.parse(args);

    const updatedNodes = await nodeService.batchUpdateNodes(
      validated.updates.map(u => ({
        nodeId: u.nodeId,
        title: u.title,
        description: u.description,
        position: u.position,
        shape: u.shape,
        tags: u.tags
      }))
    );

    logger.info('Batch updated nodes via MCP', {
      requestedCount: validated.updates.length,
      updatedCount: updatedNodes.length
    });

    const nodeList = updatedNodes.map(n =>
      `  • ${n.title} (ID: ${n.id})`
    ).join('\n');

    return {
      content: [
        {
          type: 'text' as const,
          text: `✓ Updated ${updatedNodes.length} nodes:\n${nodeList}`
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

    logger.error('Failed to batch update nodes via MCP', error);
    throw error;
  }
}
