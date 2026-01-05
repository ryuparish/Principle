import { z } from 'zod';
import { searchNodesSchema } from '../../schemas/tools.js';
import { NodeService } from '../../services/NodeService.js';
import { logger } from '../../config/logging.js';

export async function handleSearchNodes(
  args: unknown,
  nodeService: NodeService
) {
  try {
    const validated = searchNodesSchema.parse(args);

    const nodes = await nodeService.searchNodes(validated.mapId, validated.query);

    logger.debug('Searched nodes via MCP', {
      mapId: validated.mapId,
      query: validated.query,
      resultCount: nodes.length
    });

    if (nodes.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `No nodes found matching "${validated.query}"`
          }
        ]
      };
    }

    const nodeList = nodes.map(n =>
      `  • ${n.title} (ID: ${n.id})${n.tags.length ? ` [${n.tags.join(', ')}]` : ''}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${nodes.length} node(s) matching "${validated.query}":\n${nodeList}`
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

    logger.error('Failed to search nodes via MCP', error);
    throw error;
  }
}
