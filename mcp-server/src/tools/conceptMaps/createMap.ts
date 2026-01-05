import { z } from 'zod';
import { createMapSchema } from '../../schemas/tools.js';
import { ConceptMapService } from '../../services/ConceptMapService.js';
import { logger } from '../../config/logging.js';

export async function handleCreateMap(
  args: unknown,
  mapService: ConceptMapService
) {
  try {
    const validated = createMapSchema.parse(args);

    const map = await mapService.createMap({
      name: validated.name,
      description: validated.description
    });

    logger.info('Map created via MCP', { mapId: map.id, name: map.name });

    return {
      content: [
        {
          type: 'text' as const,
          text: `✓ Created concept map "${map.name}" (ID: ${map.id})`
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

    logger.error('Failed to create map via MCP', error);
    throw error;
  }
}
