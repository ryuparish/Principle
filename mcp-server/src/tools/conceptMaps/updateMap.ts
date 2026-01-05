import { z } from 'zod';
import { updateMapSchema } from '../../schemas/tools.js';
import { ConceptMapService } from '../../services/ConceptMapService.js';
import { logger } from '../../config/logging.js';

export async function handleUpdateMap(
  args: unknown,
  mapService: ConceptMapService
) {
  try {
    const validated = updateMapSchema.parse(args);

    const map = await mapService.updateMap(validated.mapId, {
      name: validated.name,
      description: validated.description,
      viewport: validated.viewport
    });

    logger.info('Map updated via MCP', { mapId: map.id });

    return {
      content: [
        {
          type: 'text' as const,
          text: `✓ Updated concept map "${map.name}" (ID: ${map.id})`
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

    if (error instanceof Error && error.message.includes('not found')) {
      return {
        content: [{
          type: 'text' as const,
          text: error.message
        }],
        isError: true
      };
    }

    logger.error('Failed to update map via MCP', error);
    throw error;
  }
}
