import ELKConstructor, { ElkNode } from 'elkjs';
import { DataSource, Repository } from 'typeorm';
import { Node } from '../entities/Node.js';
import { Edge } from '../entities/Edge.js';
import { logger } from '../config/logging.js';

// Handle both ESM and CommonJS module exports
const ELK = (ELKConstructor as any).default || ELKConstructor;
const elk = new ELK();

// Layout configuration options
export interface LayoutOptions {
  // ELK algorithm options
  algorithm?: 'layered' | 'stress' | 'force' | 'mrtree';
  direction?: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';
  nodeSpacing?: number;       // Spacing between nodes (default: 100)
  layerSpacing?: number;      // Spacing between layers (default: 150)

  // Legacy options (kept for backward compatibility)
  width?: number;
  height?: number;
  padding?: number;
  repulsionStrength?: number;
  linkDistance?: number;
  linkStrength?: number;
  collisionRadius?: number;
  centerStrength?: number;
  iterations?: number;
  pinnedNodeIds?: string[];
  minimizeCrossings?: boolean;
  crossingOptions?: any;
}

export class LayoutService {
  private nodeRepository: Repository<Node>;
  private edgeRepository: Repository<Edge>;

  constructor(dataSource: DataSource) {
    this.nodeRepository = dataSource.getRepository(Node);
    this.edgeRepository = dataSource.getRepository(Edge);
  }

  /**
   * Apply ELKjs layout to all nodes in a concept map
   */
  async autoLayoutMap(
    conceptMapId: string,
    options: LayoutOptions = {}
  ): Promise<Node[]> {
    logger.info('Starting auto-layout with ELKjs', { conceptMapId, options });

    // Fetch nodes and edges
    const nodes = await this.nodeRepository.find({
      where: { conceptMapId, isDeleted: false }
    });

    const edges = await this.edgeRepository.find({
      where: { conceptMapId }
    });

    if (nodes.length === 0) {
      logger.warn('No nodes to layout', { conceptMapId });
      return [];
    }

    // Calculate new positions using ELKjs
    const newPositions = await this.calculateLayout(
      nodes.map(n => ({ id: n.id, position: n.position })),
      edges.map(e => ({ id: e.id, sourceNodeId: e.sourceNodeId, targetNodeId: e.targetNodeId })),
      options
    );

    // Update node positions in database
    const updatedNodes = await this.updateNodePositions(nodes, newPositions);

    logger.info('Auto-layout complete', {
      conceptMapId,
      nodeCount: updatedNodes.length
    });

    return updatedNodes;
  }

  /**
   * Calculate layout positions using ELKjs
   * Uses the layered algorithm with built-in edge crossing minimization
   */
  async calculateLayout(
    nodes: Array<{ id: string; position?: { x: number; y: number } }>,
    edges: Array<{ id?: string; sourceNodeId: string; targetNodeId: string }>,
    options: LayoutOptions = {}
  ): Promise<Map<string, { x: number; y: number }>> {
    if (nodes.length === 0) {
      return new Map();
    }

    const nodeSpacing = options.nodeSpacing || options.collisionRadius || 100;
    const layerSpacing = options.layerSpacing || options.linkDistance || 150;

    // Build ELK graph structure
    const graph: ElkNode = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': options.algorithm || 'layered',
        'elk.direction': options.direction || 'RIGHT',
        'elk.spacing.nodeNode': String(nodeSpacing),
        'elk.layered.spacing.nodeNodeBetweenLayers': String(layerSpacing),
        // Enable crossing minimization (built into layered algorithm)
        'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        'elk.layered.crossingMinimization.greedySwitch.type': 'TWO_SIDED',
        // Edge routing - route edges around nodes with right-angle bends
        'elk.edgeRouting': 'ORTHOGONAL',
        // Spacing - prevent edge-node overlap
        'elk.spacing.edgeNode': '80',
        'elk.layered.spacing.edgeNodeBetweenLayers': '60',
        'elk.spacing.edgeEdge': '30',
        // Node placement strategy
        'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
        // Consider existing positions if algorithm supports it
        'elk.layered.considerModelOrder.strategy': 'PREFER_EDGES'
      },
      children: nodes.map(n => ({
        id: n.id,
        width: 180,
        height: 100
      })),
      edges: edges.map((e, i) => ({
        id: e.id || `edge-${i}`,
        sources: [e.sourceNodeId],
        targets: [e.targetNodeId]
      }))
    };

    logger.debug('Running ELK layout', {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      algorithm: options.algorithm || 'layered'
    });

    // Run ELK layout
    const result = await elk.layout(graph);

    // Extract positions
    const positions = new Map<string, { x: number; y: number }>();
    for (const child of result.children || []) {
      if (child.x !== undefined && child.y !== undefined) {
        positions.set(child.id, {
          x: Math.round(child.x),
          y: Math.round(child.y)
        });
      }
    }

    logger.debug('ELK layout complete', { positionCount: positions.size });

    return positions;
  }

  /**
   * Update node positions in the database
   */
  private async updateNodePositions(
    nodes: Node[],
    positions: Map<string, { x: number; y: number }>
  ): Promise<Node[]> {
    const updatedNodes: Node[] = [];

    for (const node of nodes) {
      const newPos = positions.get(node.id);
      if (newPos) {
        node.position = newPos;
        const saved = await this.nodeRepository.save(node);
        updatedNodes.push(saved);
      }
    }

    return updatedNodes;
  }
}
