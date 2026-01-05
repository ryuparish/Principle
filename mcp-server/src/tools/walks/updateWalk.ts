import { z } from 'zod';
import { updateWalkSchema } from '../../schemas/tools.js';
import { WalkService } from '../../services/WalkService.js';
import { logger } from '../../config/logging.js';

export async function handleUpdateWalk(
  args: unknown,
  walkService: WalkService
) {
  try {
    const validated = updateWalkSchema.parse(args);

    const walk = await walkService.updateWalk(validated.walkId, {
      name: validated.name,
      description: validated.description
    });

    logger.info('Walk updated via MCP', { walkId: walk.id });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Updated walk "${walk.name}" (ID: ${walk.id})`
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

    logger.error('Failed to update walk via MCP', error);
    throw error;
  }
}
