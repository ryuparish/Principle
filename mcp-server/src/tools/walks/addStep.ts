import { z } from 'zod';
import { addStepSchema } from '../../schemas/tools.js';
import { WalkService } from '../../services/WalkService.js';
import { logger } from '../../config/logging.js';

export async function handleAddStep(
  args: unknown,
  walkService: WalkService
) {
  try {
    const validated = addStepSchema.parse(args);

    const step = await walkService.addStep(validated.walkId, {
      nodeId: validated.nodeId,
      order: validated.order,
      annotation: validated.annotation,
      zoomLevel: validated.zoomLevel,
      duration: validated.duration
    });

    logger.info('Step added via MCP', { stepId: step.id, walkId: validated.walkId });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Added step to walk (Step ID: ${step.id}, Order: ${step.order}, Node: ${step.nodeId})`
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

    logger.error('Failed to add step via MCP', error);
    throw error;
  }
}
