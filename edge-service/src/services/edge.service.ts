import { Edge } from '../entities/Edge';
import { AppDataSource } from '../data-source';

export interface CreateEdgeInput {
  conceptMapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  style?: any;
}

export interface UpdateEdgeInput {
  label?: string;
  style?: any;
}

export class EdgeService {
  private edgeRepository = AppDataSource.getRepository(Edge);

  async getEdgesByConceptMap(conceptMapId: string): Promise<Edge[]> {
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

  async createEdge(data: CreateEdgeInput): Promise<Edge> {
    const edge = this.edgeRepository.create({
      conceptMapId: data.conceptMapId,
      sourceNodeId: data.sourceNodeId,
      targetNodeId: data.targetNodeId,
      label: data.label,
      style: data.style || {}
    });

    return await this.edgeRepository.save(edge);
  }

  async updateEdge(id: string, data: UpdateEdgeInput): Promise<Edge> {
    const updateData: any = {};
    if (data.label !== undefined) updateData.label = data.label;
    if (data.style !== undefined) updateData.style = data.style;

    await this.edgeRepository.update({ id }, updateData);

    const updated = await this.edgeRepository.findOne({ where: { id } });
    if (!updated) {
      throw new Error('Edge not found after update');
    }
    return updated;
  }

  async deleteEdge(id: string): Promise<void> {
    await this.edgeRepository.delete({ id });
  }
}

export const edgeService = new EdgeService();
