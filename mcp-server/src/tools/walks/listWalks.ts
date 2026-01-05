import { z } from 'zod';
import { listWalksSchema } from '../../schemas/tools.js';
import { WalkService } from '../../services/WalkService.js';
import { logger } from '../../config/logging.js';

export async function handleListWalks(
  args: unknown,
  walkService: WalkService
) {
  try {
    const validated = listWalksSchema.parse(args);

    const walksWithSteps = await walkService.getWalksByConceptMap(validated.mapId);

    logger.info('Walks listed via MCP', { mapId: validated.mapId, count: walksWithSteps.length });

    if (walksWithSteps.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `No walks found for concept map (ID: ${validated.mapId})`
          }
        ]
      };
    }

    const walksList = walksWithSteps.map(({ walk, steps }) =>
      `- "${walk.name}" (ID: ${walk.id}) - ${steps.length} steps`
    ).join('\n');

    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${walksWithSteps.length} walk(s) for concept map:\n${walksList}`
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

    logger.error('Failed to list walks via MCP', error);
    throw error;
  }
}
