import { z } from 'zod';
import { updateStepSchema } from '../../schemas/tools.js';
import { WalkService } from '../../services/WalkService.js';
import { logger } from '../../config/logging.js';

export async function handleUpdateStep(
  args: unknown,
  walkService: WalkService
) {
  try {
    const validated = updateStepSchema.parse(args);

    const step = await walkService.updateStep(validated.stepId, {
      annotation: validated.annotation,
      zoomLevel: validated.zoomLevel,
      duration: validated.duration,
      order: validated.order
    });

    logger.info('Step updated via MCP', { stepId: step.id });

    const updates = [];
    if (validated.annotation !== undefined) updates.push('annotation');
    if (validated.zoomLevel !== undefined) updates.push(`zoom: ${validated.zoomLevel}x`);
    if (validated.duration !== undefined) updates.push(`duration: ${validated.duration}ms`);
    if (validated.order !== undefined) updates.push(`order: ${validated.order}`);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Updated step (ID: ${step.id})${updates.length > 0 ? ` - Changed: ${updates.join(', ')}` : ''}`
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

    logger.error('Failed to update step via MCP', error);
    throw error;
  }
}
