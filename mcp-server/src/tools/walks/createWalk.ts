import { z } from 'zod';
import { createWalkSchema } from '../../schemas/tools.js';
import { WalkService } from '../../services/WalkService.js';
import { logger } from '../../config/logging.js';

export async function handleCreateWalk(
  args: unknown,
  walkService: WalkService
) {
  try {
    const validated = createWalkSchema.parse(args);

    const walk = await walkService.createWalk({
      conceptMapId: validated.mapId,
      name: validated.name,
      description: validated.description
    });

    logger.info('Walk created via MCP', { walkId: walk.id, name: walk.name });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Created walk "${walk.name}" (ID: ${walk.id})`
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

    logger.error('Failed to create walk via MCP', error);
    throw error;
  }
}
