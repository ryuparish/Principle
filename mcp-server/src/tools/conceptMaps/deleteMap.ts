import { z } from 'zod';
import { deleteMapSchema } from '../../schemas/tools.js';
import { ConceptMapService } from '../../services/ConceptMapService.js';
import { logger } from '../../config/logging.js';

export async function handleDeleteMap(
  args: unknown,
  mapService: ConceptMapService
) {
  try {
    const validated = deleteMapSchema.parse(args);

    // Get map info before deleting for the response message
    const map = await mapService.getMapById(validated.mapId);
    if (!map) {
      return {
        content: [{
          type: 'text' as const,
          text: `Concept map ${validated.mapId} not found`
        }],
        isError: true
      };
    }

    await mapService.deleteMap(validated.mapId);

    logger.info('Map deleted via MCP', { mapId: validated.mapId });

    return {
      content: [
        {
          type: 'text' as const,
          text: `✓ Deleted concept map "${map.name}" (ID: ${validated.mapId})`
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

    logger.error('Failed to delete map via MCP', error);
    throw error;
  }
}
