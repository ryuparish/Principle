import { z } from 'zod';
import { createEdgeSchema } from '../../schemas/tools.js';
import { EdgeService } from '../../services/EdgeService.js';
import { logger } from '../../config/logging.js';

export async function handleCreateEdge(
  args: unknown,
  edgeService: EdgeService
) {
  try {
    const validated = createEdgeSchema.parse(args);

    const edge = await edgeService.createEdge({
      conceptMapId: validated.mapId,
      sourceNodeId: validated.sourceNodeId,
      targetNodeId: validated.targetNodeId,
      label: validated.label,
      style: validated.style
    });

    logger.info('Edge created via MCP', { edgeId: edge.id });

    return {
      content: [
        {
          type: 'text' as const,
          text: `✓ Created edge from ${validated.sourceNodeId.slice(0, 8)}... to ${validated.targetNodeId.slice(0, 8)}...${validated.label ? ` with label "${validated.label}"` : ''} (ID: ${edge.id})`
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

    logger.error('Failed to create edge via MCP', error);
    throw error;
  }
}
