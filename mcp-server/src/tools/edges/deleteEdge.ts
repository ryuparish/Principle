import { z } from 'zod';
import { deleteEdgeSchema } from '../../schemas/tools.js';
import { EdgeService } from '../../services/EdgeService.js';
import { logger } from '../../config/logging.js';

export async function handleDeleteEdge(
  args: unknown,
  edgeService: EdgeService
) {
  try {
    const validated = deleteEdgeSchema.parse(args);

    // Get edge info before deleting for the response message
    const edge = await edgeService.getEdgeById(validated.edgeId);
    if (!edge) {
      return {
        content: [{
          type: 'text' as const,
          text: `Edge ${validated.edgeId} not found`
        }],
        isError: true
      };
    }

    await edgeService.deleteEdge(validated.edgeId);

    logger.info('Edge deleted via MCP', { edgeId: validated.edgeId });

    return {
      content: [
        {
          type: 'text' as const,
          text: `✓ Deleted edge${edge.label ? ` "${edge.label}"` : ''} (${edge.sourceNodeId.slice(0, 8)}... → ${edge.targetNodeId.slice(0, 8)}...)`
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

    logger.error('Failed to delete edge via MCP', error);
    throw error;
  }
}
