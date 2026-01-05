import { z } from 'zod';
import { batchCreateEdgesSchema } from '../../schemas/tools.js';
import { EdgeService } from '../../services/EdgeService.js';
import { logger } from '../../config/logging.js';

export async function handleBatchCreateEdges(
  args: unknown,
  edgeService: EdgeService
) {
  try {
    const validated = batchCreateEdgesSchema.parse(args);

    const createdEdges = await edgeService.batchCreateEdges(
      validated.mapId,
      validated.edges.map(e => ({
        sourceNodeId: e.sourceNodeId,
        targetNodeId: e.targetNodeId,
        label: e.label,
        style: e.style
      }))
    );

    logger.info('Batch created edges via MCP', {
      count: createdEdges.length,
      mapId: validated.mapId
    });

    const edgeList = createdEdges.map(e =>
      `  • ${e.sourceNodeId.slice(0, 8)}... → ${e.targetNodeId.slice(0, 8)}...${e.label ? ` [${e.label}]` : ''} (ID: ${e.id})`
    ).join('\n');

    return {
      content: [
        {
          type: 'text' as const,
          text: `✓ Created ${createdEdges.length} edge(s) in concept map:\n${edgeList}`
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

    logger.error('Failed to batch create edges via MCP', error);
    throw error;
  }
}
