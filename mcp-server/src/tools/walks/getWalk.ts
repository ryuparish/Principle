import { z } from 'zod';
import { getWalkSchema } from '../../schemas/tools.js';
import { WalkService } from '../../services/WalkService.js';
import { logger } from '../../config/logging.js';

export async function handleGetWalk(
  args: unknown,
  walkService: WalkService
) {
  try {
    const validated = getWalkSchema.parse(args);

    const result = await walkService.getWalkById(validated.walkId);

    if (!result) {
      return {
        content: [{
          type: 'text' as const,
          text: `Walk not found (ID: ${validated.walkId})`
        }],
        isError: true
      };
    }

    const { walk, steps } = result;

    logger.info('Walk retrieved via MCP', { walkId: walk.id, stepCount: steps.length });

    const stepsText = steps.length > 0
      ? steps.map((s, i) => `  ${i + 1}. Node: ${s.nodeId}${s.annotation ? ` - "${s.annotation.substring(0, 50)}${s.annotation.length > 50 ? '...' : ''}"` : ''}`).join('\n')
      : '  (no steps)';

    return {
      content: [
        {
          type: 'text' as const,
          text: `Walk: "${walk.name}" (ID: ${walk.id})
Description: ${walk.description || '(none)'}
Steps (${steps.length}):
${stepsText}`
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

    logger.error('Failed to get walk via MCP', error);
    throw error;
  }
}
