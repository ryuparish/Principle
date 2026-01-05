import { z } from 'zod';
import { updateEdgeSchema } from '../../schemas/tools.js';
import { EdgeService } from '../../services/EdgeService.js';
import { logger } from '../../config/logging.js';

export async function handleUpdateEdge(
  args: unknown,
  edgeService: EdgeService
) {
  try {
    const validated = updateEdgeSchema.parse(args);

    const edge = await edgeService.updateEdge(validated.edgeId, {
      label: validated.label,
      style: validated.style
    });

    logger.info('Edge updated via MCP', { edgeId: edge.id });

    return {
      content: [
        {
          type: 'text' as const,
          text: `✓ Updated edge (ID: ${edge.id})${edge.label ? ` - label: "${edge.label}"` : ''}`
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

    logger.error('Failed to update edge via MCP', error);
    throw error;
  }
}
