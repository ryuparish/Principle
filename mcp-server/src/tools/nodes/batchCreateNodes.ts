import { z } from 'zod';
import { batchCreateNodesSchema } from '../../schemas/tools.js';
import { NodeService } from '../../services/NodeService.js';
import { EdgeService } from '../../services/EdgeService.js';
import { LayoutService } from '../../services/LayoutService.js';
import { logger } from '../../config/logging.js';

export async function handleBatchCreateNodes(
  args: unknown,
  nodeService: NodeService,
  edgeService: EdgeService,
  layoutService: LayoutService
) {
  try {
    const validated = batchCreateNodesSchema.parse(args);

    // Create nodes with optional auto-layout
    const createdNodes = await nodeService.batchCreateNodes(
      validated.mapId,
      validated.nodes.map(n => ({
        title: n.title,
        description: n.description,
        position: n.position,
        shape: n.shape,
        tags: n.tags
      })),
      {
        edges: validated.edges,
        autoLayout: validated.autoLayout,
        layoutOptions: validated.layoutOptions
      }
    );

    logger.info('Batch created nodes via MCP', {
      count: createdNodes.length,
      mapId: validated.mapId,
      hasEdges: !!validated.edges?.length
    });

    // Create edges if provided
    let createdEdges: { id: string }[] = [];
    if (validated.edges && validated.edges.length > 0) {
      const edgesToCreate = validated.edges.map(edge => ({
        sourceNodeId: createdNodes[edge.sourceIndex].id,
        targetNodeId: createdNodes[edge.targetIndex].id,
        label: edge.label,
        style: edge.style
      }));

      createdEdges = await edgeService.batchCreateEdges(validated.mapId, edgesToCreate);

      logger.info('Batch created edges via MCP', {
        count: createdEdges.length,
        mapId: validated.mapId
      });
    }

    const nodeList = createdNodes.map(n =>
      `  • ${n.title} (ID: ${n.id})`
    ).join('\n');

    let responseText = `✓ Created ${createdNodes.length} nodes in concept map:\n${nodeList}`;

    if (createdEdges.length > 0) {
      responseText += `\n\n✓ Created ${createdEdges.length} edges connecting the nodes`;
      if (validated.edges?.length || validated.autoLayout) {
        responseText += `\n✓ Applied force-directed layout for optimal node positioning`;
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: responseText
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

    logger.error('Failed to batch create nodes via MCP', error);
    throw error;
  }
}
