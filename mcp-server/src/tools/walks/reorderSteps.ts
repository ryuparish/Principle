import { z } from 'zod';
import { reorderStepsSchema } from '../../schemas/tools.js';
import { WalkService } from '../../services/WalkService.js';
import { logger } from '../../config/logging.js';

export async function handleReorderSteps(
  args: unknown,
  walkService: WalkService
) {
  try {
    const validated = reorderStepsSchema.parse(args);

    const steps = await walkService.reorderSteps(validated.walkId, validated.stepIds);

    logger.info('Steps reordered via MCP', { walkId: validated.walkId, stepCount: steps.length });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Reordered ${steps.length} step(s) in walk (ID: ${validated.walkId})`
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

    logger.error('Failed to reorder steps via MCP', error);
    throw error;
  }
}
