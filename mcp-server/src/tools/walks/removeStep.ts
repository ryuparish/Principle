import { z } from 'zod';
import { removeStepSchema } from '../../schemas/tools.js';
import { WalkService } from '../../services/WalkService.js';
import { logger } from '../../config/logging.js';

export async function handleRemoveStep(
  args: unknown,
  walkService: WalkService
) {
  try {
    const validated = removeStepSchema.parse(args);

    await walkService.removeStep(validated.stepId);

    logger.info('Step removed via MCP', { stepId: validated.stepId });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Removed step (ID: ${validated.stepId})`
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

    logger.error('Failed to remove step via MCP', error);
    throw error;
  }
}
