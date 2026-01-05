import { z } from 'zod';
import { getEdgesSchema } from '../../schemas/tools.js';
import { EdgeService } from '../../services/EdgeService.js';
import { logger } from '../../config/logging.js';

export async function handleGetEdges(
  args: unknown,
  edgeService: EdgeService
) {
  try {
    const validated = getEdgesSchema.parse(args);

    const edges = await edgeService.getEdgesByConceptMap(validated.mapId);

    logger.debug('Got edges via MCP', {
      mapId: validated.mapId,
      count: edges.length
    });

    if (edges.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `No edges found in concept map ${validated.mapId}`
          }
        ]
      };
    }

    const edgeList = edges.map(e =>
      `  • ${e.sourceNodeId.slice(0, 8)}... → ${e.targetNodeId.slice(0, 8)}...${e.label ? ` [${e.label}]` : ''} (ID: ${e.id})`
    ).join('\n');

    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${edges.length} edge(s) in concept map:\n${edgeList}`
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

    logger.error('Failed to get edges via MCP', error);
    throw error;
  }
}
