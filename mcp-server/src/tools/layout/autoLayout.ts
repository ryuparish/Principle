import { z } from 'zod';
import { autoLayoutSchema } from '../../schemas/tools.js';
import { LayoutService } from '../../services/LayoutService.js';
import { logger } from '../../config/logging.js';

export async function handleAutoLayout(
  args: unknown,
  layoutService: LayoutService
) {
  try {
    const validated = autoLayoutSchema.parse(args);

    const updatedNodes = await layoutService.autoLayoutMap(
      validated.mapId,
      validated.options
    );

    logger.info('Auto-layout completed via MCP', {
      mapId: validated.mapId,
      nodeCount: updatedNodes.length
    });

    if (updatedNodes.length === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: 'No nodes found to layout in this concept map.'
        }]
      };
    }

    // Show first few nodes as examples
    const summary = updatedNodes.slice(0, 5).map(n =>
      `  - ${n.title}: (${n.position.x}, ${n.position.y})`
    ).join('\n');

    const moreText = updatedNodes.length > 5
      ? `\n  ... and ${updatedNodes.length - 5} more nodes`
      : '';

    const crossingNote = validated.options?.minimizeCrossings
      ? '\n\nEdge crossing optimization was applied using simulated annealing.'
      : '';

    return {
      content: [{
        type: 'text' as const,
        text: `Applied force-directed layout to ${updatedNodes.length} nodes:\n${summary}${moreText}${crossingNote}`
      }]
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        content: [{
          type: 'text' as const,
          text: `Validation error: ${error.errors.map(e =>
            `${e.path.join('.')}: ${e.message}`
          ).join(', ')}`
        }],
        isError: true
      };
    }

    logger.error('Failed to auto-layout via MCP', error);
    throw error;
  }
}
