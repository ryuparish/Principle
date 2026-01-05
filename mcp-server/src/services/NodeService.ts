import { DataSource, Repository, Like } from 'typeorm';
import { Node } from '../entities/Node.js';
import { logger } from '../config/logging.js';
import { LayoutService, LayoutOptions } from './LayoutService.js';

// TipTap document structure types
interface TipTapTextNode {
  type: 'text';
  text: string;
}

interface TipTapParagraph {
  type: 'paragraph';
  content?: TipTapTextNode[];
}

interface TipTapDocument {
  type: 'doc';
  content: TipTapParagraph[];
  driveAttachments: any[];
}

/**
 * Convert plain text to TipTap document format
 * Each line becomes a paragraph, empty lines become empty paragraphs
 */
function textToTipTap(text: string): TipTapDocument {
  const lines = text.split('\n');
  const paragraphs: TipTapParagraph[] = lines.map(line => {
    if (line.trim()) {
      return {
        type: 'paragraph',
        content: [{ type: 'text', text: line }]
      };
    } else {
      return { type: 'paragraph' };
    }
  });

  return {
    type: 'doc',
    content: paragraphs,
    driveAttachments: []
  };
}

// Edge definition for batch creation (references nodes by index)
export interface BatchEdgeInput {
  sourceIndex: number;
  targetIndex: number;
  label?: string;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    animated?: boolean;
    type?: string;
    edgeType?: string;
  };
}

// Options for batch creation with layout
export interface BatchCreateOptions {
  edges?: BatchEdgeInput[];
  autoLayout?: boolean;
  layoutOptions?: LayoutOptions;
}

export interface CreateNodeInput {
  conceptMapId: string;
  title: string;
  description?: string;
  position?: { x: number; y: number };
  shape?: string;
  tags?: string[];
}

export interface UpdateNodeInput {
  title?: string;
  description?: string;
  position?: { x: number; y: number };
  shape?: string;
  tags?: string[];
}

export interface BatchUpdateNodeInput {
  nodeId: string;
  title?: string;
  description?: string;
  position?: { x: number; y: number };
  shape?: string;
  tags?: string[];
}

export class NodeService {
  private nodeRepository: Repository<Node>;
  private layoutService?: LayoutService;

  constructor(dataSource: DataSource, layoutService?: LayoutService) {
    this.nodeRepository = dataSource.getRepository(Node);
    this.layoutService = layoutService;
  }

  async getNodeById(id: string): Promise<Node | null> {
    return await this.nodeRepository.findOne({
      where: { id, isDeleted: false }
    });
  }

  async getNodesByMapId(conceptMapId: string): Promise<Node[]> {
    return await this.nodeRepository.find({
      where: { conceptMapId, isDeleted: false },
      order: { createdAt: 'ASC' }
    });
  }

  async createNode(input: CreateNodeInput): Promise<Node> {
    logger.info('Creating node', { title: input.title, mapId: input.conceptMapId });

    // Convert description to TipTap format, or use empty doc
    const content = input.description
      ? textToTipTap(input.description)
      : { type: 'doc', content: [], driveAttachments: [] };

    const node = this.nodeRepository.create({
      conceptMapId: input.conceptMapId,
      title: input.title,
      content,
      position: input.position || { x: 0, y: 0 },
      shape: input.shape || 'rounded-rectangle',
      tags: input.tags || [],
      nodeType: 'regular',
      style: {},
      imageIds: []
    });

    return await this.nodeRepository.save(node);
  }

  async batchCreateNodes(
    conceptMapId: string,
    nodes: Omit<CreateNodeInput, 'conceptMapId'>[],
    options?: BatchCreateOptions
  ): Promise<Node[]> {
    logger.info('Batch creating nodes', {
      count: nodes.length,
      mapId: conceptMapId,
      hasEdges: !!options?.edges?.length,
      autoLayout: options?.autoLayout
    });

    // Create node entities with temporary grid positions
    const nodeEntities = nodes.map((input, index) => {
      // Use provided position or temporary grid layout
      const position = input.position || {
        x: 100 + (index % 5) * 250,
        y: 100 + Math.floor(index / 5) * 150
      };

      // Convert description to TipTap format
      const content = input.description
        ? textToTipTap(input.description)
        : { type: 'doc', content: [], driveAttachments: [] };

      return this.nodeRepository.create({
        conceptMapId,
        title: input.title,
        content,
        position,
        shape: input.shape || 'rounded-rectangle',
        tags: input.tags || [],
        nodeType: 'regular',
        style: {},
        imageIds: []
      });
    });

    // Save nodes to get IDs
    const savedNodes = await this.nodeRepository.save(nodeEntities);

    // Apply force-directed layout if edges are provided or autoLayout is requested
    const shouldLayout = (options?.edges?.length && options.edges.length > 0) || options?.autoLayout;

    if (shouldLayout && this.layoutService) {
      logger.info('Applying force-directed layout', {
        nodeCount: savedNodes.length,
        edgeCount: options?.edges?.length || 0
      });

      // Convert index-based edges to ID-based edges
      const edgesForLayout = (options?.edges || []).map(edge => ({
        sourceNodeId: savedNodes[edge.sourceIndex].id,
        targetNodeId: savedNodes[edge.targetIndex].id
      }));

      // Calculate optimal positions using force-directed algorithm
      const positions = await this.layoutService.calculateLayout(
        savedNodes.map(n => ({ id: n.id, position: n.position })),
        edgesForLayout,
        options?.layoutOptions
      );

      // Update node positions with calculated layout
      for (const node of savedNodes) {
        const newPos = positions.get(node.id);
        if (newPos) {
          node.position = newPos;
        }
      }

      // Save updated positions
      await this.nodeRepository.save(savedNodes);

      logger.info('Force-directed layout applied', {
        nodeCount: savedNodes.length
      });
    }

    return savedNodes;
  }

  async updateNode(id: string, input: UpdateNodeInput): Promise<Node> {
    logger.info('Updating node', { id });

    const node = await this.nodeRepository.findOne({ where: { id } });
    if (!node) {
      throw new Error(`Node ${id} not found`);
    }

    if (input.title !== undefined) node.title = input.title;
    if (input.description !== undefined) {
      // Convert description to TipTap format, preserving driveAttachments if they exist
      const existingAttachments = (node.content as any)?.driveAttachments || [];
      const newContent = textToTipTap(input.description);
      newContent.driveAttachments = existingAttachments;
      node.content = newContent;
    }
    if (input.position !== undefined) node.position = input.position;
    if (input.shape !== undefined) node.shape = input.shape;
    if (input.tags !== undefined) node.tags = input.tags;

    return await this.nodeRepository.save(node);
  }

  async batchUpdateNodes(updates: BatchUpdateNodeInput[]): Promise<Node[]> {
    logger.info('Batch updating nodes', { count: updates.length });

    const updatedNodes: Node[] = [];

    for (const update of updates) {
      const node = await this.nodeRepository.findOne({ where: { id: update.nodeId } });
      if (!node) {
        logger.warn(`Node ${update.nodeId} not found, skipping`);
        continue;
      }

      if (update.title !== undefined) node.title = update.title;
      if (update.description !== undefined) {
        // Convert description to TipTap format, preserving driveAttachments if they exist
        const existingAttachments = (node.content as any)?.driveAttachments || [];
        const newContent = textToTipTap(update.description);
        newContent.driveAttachments = existingAttachments;
        node.content = newContent;
      }
      if (update.position !== undefined) node.position = update.position;
      if (update.shape !== undefined) node.shape = update.shape;
      if (update.tags !== undefined) node.tags = update.tags;

      updatedNodes.push(node);
    }

    // Save all updated nodes at once
    const savedNodes = await this.nodeRepository.save(updatedNodes);
    logger.info('Batch update complete', { updatedCount: savedNodes.length });

    return savedNodes;
  }

  async deleteNode(id: string): Promise<void> {
    logger.info('Soft-deleting node', { id });

    const result = await this.nodeRepository.update(
      { id },
      { isDeleted: true, deletedAt: new Date() }
    );

    if (result.affected === 0) {
      throw new Error(`Node ${id} not found`);
    }
  }

  async searchNodes(conceptMapId: string, query: string): Promise<Node[]> {
    logger.debug('Searching nodes', { mapId: conceptMapId, query });

    return await this.nodeRepository.find({
      where: {
        conceptMapId,
        isDeleted: false,
        title: Like(`%${query}%`)
      },
      order: { updatedAt: 'DESC' },
      take: 20
    });
  }
}
