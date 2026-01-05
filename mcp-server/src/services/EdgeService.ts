import { DataSource, Repository } from 'typeorm';
import { Edge } from '../entities/Edge.js';
import { Node } from '../entities/Node.js';
import { logger } from '../config/logging.js';
import { getClosestHandles, HandleId } from '../utils/handleGeometry.js';

export interface CreateEdgeInput {
  conceptMapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    animated?: boolean;
    type?: 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier';
  };
}

export interface UpdateEdgeInput {
  label?: string;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    animated?: boolean;
    type?: 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier';
  };
}

export class EdgeService {
  private edgeRepository: Repository<Edge>;
  private nodeRepository: Repository<Node>;

  constructor(dataSource: DataSource) {
    this.edgeRepository = dataSource.getRepository(Edge);
    this.nodeRepository = dataSource.getRepository(Node);
  }

  /**
   * Calculate optimal handles for an edge based on source and target node positions
   */
  private async calculateHandles(
    sourceNodeId: string,
    targetNodeId: string
  ): Promise<{ sourceHandleId: HandleId; targetHandleId: HandleId } | null> {
    const [sourceNode, targetNode] = await Promise.all([
      this.nodeRepository.findOne({ where: { id: sourceNodeId } }),
      this.nodeRepository.findOne({ where: { id: targetNodeId } })
    ]);

    if (!sourceNode || !targetNode) {
      logger.warn('Could not find nodes for handle calculation', {
        sourceNodeId,
        targetNodeId,
        foundSource: !!sourceNode,
        foundTarget: !!targetNode
      });
      return null;
    }

    const handles = getClosestHandles(
      sourceNode.position,
      targetNode.position,
      sourceNode.shape,
      targetNode.shape
    );

    return {
      sourceHandleId: handles.sourceHandle,
      targetHandleId: handles.targetHandle
    };
  }

  async getEdgesByConceptMap(conceptMapId: string): Promise<Edge[]> {
    logger.debug('Fetching edges for concept map', { conceptMapId });
    return await this.edgeRepository.find({
      where: { conceptMapId },
      order: { createdAt: 'ASC' }
    });
  }

  async getEdgeById(id: string): Promise<Edge | null> {
    return await this.edgeRepository.findOne({
      where: { id }
    });
  }

  async createEdge(input: CreateEdgeInput): Promise<Edge> {
    logger.info('Creating edge', {
      mapId: input.conceptMapId,
      source: input.sourceNodeId,
      target: input.targetNodeId
    });

    // Check if edge already exists (prevent duplicates)
    const existing = await this.edgeRepository.findOne({
      where: {
        sourceNodeId: input.sourceNodeId,
        targetNodeId: input.targetNodeId
      }
    });

    if (existing) {
      logger.warn('Edge already exists', { existingId: existing.id });
      return existing;
    }

    // Calculate optimal handles based on node positions
    const handles = await this.calculateHandles(input.sourceNodeId, input.targetNodeId);

    // Default to bezier (curved) edges if no type specified
    const defaultStyle = { type: 'bezier' as const };
    const mergedStyle = { ...defaultStyle, ...(input.style || {}) };

    const edge = this.edgeRepository.create({
      conceptMapId: input.conceptMapId,
      sourceNodeId: input.sourceNodeId,
      targetNodeId: input.targetNodeId,
      label: input.label,
      style: mergedStyle,
      sourceHandleId: handles?.sourceHandleId,
      targetHandleId: handles?.targetHandleId
    });

    logger.debug('Edge created with optimal handles', {
      sourceHandle: handles?.sourceHandleId,
      targetHandle: handles?.targetHandleId
    });

    return await this.edgeRepository.save(edge);
  }

  async batchCreateEdges(conceptMapId: string, edges: Omit<CreateEdgeInput, 'conceptMapId'>[]): Promise<Edge[]> {
    logger.info('Batch creating edges', { count: edges.length, mapId: conceptMapId });

    // Collect all unique node IDs to fetch positions in bulk
    const nodeIds = new Set<string>();
    for (const edge of edges) {
      nodeIds.add(edge.sourceNodeId);
      nodeIds.add(edge.targetNodeId);
    }

    // Fetch all node positions in a single query for efficiency
    const nodes = await this.nodeRepository.find({
      where: Array.from(nodeIds).map(id => ({ id }))
    });

    // Build a map of node ID -> position/shape for quick lookup
    const nodeMap = new Map<string, { position: { x: number; y: number }; shape: string }>();
    for (const node of nodes) {
      nodeMap.set(node.id, { position: node.position, shape: node.shape });
    }

    logger.debug('Fetched node positions for handle calculation', {
      requestedNodes: nodeIds.size,
      foundNodes: nodes.length
    });

    const createdEdges: Edge[] = [];

    for (const edgeInput of edges) {
      // Check for existing edge to avoid duplicates
      const existing = await this.edgeRepository.findOne({
        where: {
          sourceNodeId: edgeInput.sourceNodeId,
          targetNodeId: edgeInput.targetNodeId
        }
      });

      if (existing) {
        logger.debug('Skipping duplicate edge', {
          source: edgeInput.sourceNodeId,
          target: edgeInput.targetNodeId
        });
        createdEdges.push(existing);
        continue;
      }

      // Calculate optimal handles for this edge
      const sourceNode = nodeMap.get(edgeInput.sourceNodeId);
      const targetNode = nodeMap.get(edgeInput.targetNodeId);

      let sourceHandleId: HandleId | undefined;
      let targetHandleId: HandleId | undefined;

      if (sourceNode && targetNode) {
        const handles = getClosestHandles(
          sourceNode.position,
          targetNode.position,
          sourceNode.shape,
          targetNode.shape
        );
        sourceHandleId = handles.sourceHandle;
        targetHandleId = handles.targetHandle;
      }

      // Default to bezier (curved) edges if no type specified
      const defaultStyle = { type: 'bezier' as const };
      const mergedStyle = { ...defaultStyle, ...(edgeInput.style || {}) };

      const edge = this.edgeRepository.create({
        conceptMapId,
        sourceNodeId: edgeInput.sourceNodeId,
        targetNodeId: edgeInput.targetNodeId,
        label: edgeInput.label,
        style: mergedStyle,
        sourceHandleId,
        targetHandleId
      });

      const saved = await this.edgeRepository.save(edge);
      createdEdges.push(saved);
    }

    logger.info('Batch created edges with optimal handles', { count: createdEdges.length });
    return createdEdges;
  }

  async updateEdge(id: string, input: UpdateEdgeInput): Promise<Edge> {
    logger.info('Updating edge', { id });

    const edge = await this.edgeRepository.findOne({ where: { id } });
    if (!edge) {
      throw new Error(`Edge ${id} not found`);
    }

    if (input.label !== undefined) edge.label = input.label;
    if (input.style !== undefined) edge.style = { ...edge.style, ...input.style };

    return await this.edgeRepository.save(edge);
  }

  async deleteEdge(id: string): Promise<void> {
    logger.info('Deleting edge', { id });
    const result = await this.edgeRepository.delete({ id });

    if (result.affected === 0) {
      throw new Error(`Edge ${id} not found`);
    }
  }

  async deleteEdgesByNodes(sourceNodeId: string, targetNodeId: string): Promise<void> {
    logger.info('Deleting edge by node IDs', { sourceNodeId, targetNodeId });
    await this.edgeRepository.delete({ sourceNodeId, targetNodeId });
  }

  async getEdgesBetweenNodes(nodeIds: string[]): Promise<Edge[]> {
    logger.debug('Finding edges between nodes', { nodeCount: nodeIds.length });

    return await this.edgeRepository
      .createQueryBuilder('edge')
      .where('edge.sourceNodeId IN (:...nodeIds)', { nodeIds })
      .andWhere('edge.targetNodeId IN (:...nodeIds)', { nodeIds })
      .getMany();
  }
}
