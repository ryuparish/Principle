import { Node } from '../entities/Node';
import { AppDataSource } from '../data-source';
import { Like } from 'typeorm';

export interface CreateNodeInput {
  id?: string;
  conceptMapId: string;
  title: string;
  content?: any;
  position: {
    x: number;
    y: number;
  };
  style?: any;
  shape?: string;
}

export interface UpdateNodeInput {
  title?: string;
  content?: any;
  position?: {
    x: number;
    y: number;
  };
  style?: any;
  imageIds?: string[];
  tags?: string[];
  shape?: string;
}

export class NodeService {
  private nodeRepository = AppDataSource.getRepository(Node);

  async getNodesByConceptMap(conceptMapId: string): Promise<Node[]> {
    return await this.nodeRepository.find({
      where: {
        conceptMapId,
        isDeleted: false
      },
      order: { createdAt: 'ASC' }
    });
  }

  async getNodeById(id: string): Promise<Node | null> {
    return await this.nodeRepository.findOne({
      where: { id }
    });
  }

  async createNode(data: CreateNodeInput): Promise<Node> {
    const node = this.nodeRepository.create({
      ...(data.id && { id: data.id }), // Preserve ID if provided (for undo/redo)
      conceptMapId: data.conceptMapId,
      title: data.title,
      content: data.content || {},
      position: data.position,
      style: data.style || {},
      shape: data.shape || 'rounded-rectangle'
    });

    return await this.nodeRepository.save(node);
  }

  async batchCreateNodes(nodes: CreateNodeInput[]): Promise<Node[]> {
    const nodeEntities = nodes.map(data =>
      this.nodeRepository.create({
        ...(data.id && { id: data.id }),
        conceptMapId: data.conceptMapId,
        title: data.title,
        content: data.content || {},
        position: data.position,
        style: data.style || {},
        shape: data.shape || 'rounded-rectangle'
      })
    );

    return await this.nodeRepository.save(nodeEntities);
  }

  async updateNode(id: string, data: UpdateNodeInput): Promise<Node> {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    // TypeORM's update() bypasses transformers, so we must stringify JSON fields manually
    if (data.content !== undefined) {
      updateData.content = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
    }
    if (data.position !== undefined) {
      updateData.position = typeof data.position === 'string' ? data.position : JSON.stringify(data.position);
    }
    if (data.style !== undefined) {
      updateData.style = typeof data.style === 'string' ? data.style : JSON.stringify(data.style);
    }
    if (data.imageIds !== undefined) {
      updateData.imageIds = typeof data.imageIds === 'string' ? data.imageIds : JSON.stringify(data.imageIds);
    }
    if (data.tags !== undefined) {
      updateData.tags = typeof data.tags === 'string' ? data.tags : JSON.stringify(data.tags);
    }
    if (data.shape !== undefined) updateData.shape = data.shape;

    await this.nodeRepository.update({ id }, updateData);

    const updated = await this.nodeRepository.findOne({ where: { id } });
    if (!updated) {
      throw new Error('Node not found after update');
    }
    return updated;
  }

  async deleteNode(id: string): Promise<void> {
    // Soft delete
    await this.nodeRepository.update(
      { id },
      {
        isDeleted: true,
        deletedAt: new Date()
      }
    );
  }

  async undeleteNode(id: string): Promise<Node> {
    // Un-delete (restore soft-deleted node)
    await this.nodeRepository.update(
      { id },
      {
        isDeleted: false,
        deletedAt: undefined
      }
    );

    const node = await this.nodeRepository.findOne({ where: { id } });
    if (!node) {
      throw new Error('Node not found after undelete');
    }
    return node;
  }

  async searchNodes(conceptMapId: string, query: string): Promise<Node[]> {
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

export const nodeService = new NodeService();
