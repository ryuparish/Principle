import { z } from 'zod';
import { deleteWalkSchema } from '../../schemas/tools.js';
import { WalkService } from '../../services/WalkService.js';
import { logger } from '../../config/logging.js';

export async function handleDeleteWalk(
  args: unknown,
  walkService: WalkService
) {
  try {
    const validated = deleteWalkSchema.parse(args);

    await walkService.deleteWalk(validated.walkId);

    logger.info('Walk deleted via MCP', { walkId: validated.walkId });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Deleted walk (ID: ${validated.walkId})`
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

    logger.error('Failed to delete walk via MCP', error);
    throw error;
  }
}
