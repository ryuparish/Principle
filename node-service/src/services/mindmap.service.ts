import { ConceptMap } from '../entities/ConceptMap';
import { AppDataSource } from '../data-source';

export interface CreateConceptMapInput {
  name: string;
  description?: string;
}

export interface UpdateConceptMapInput {
  name?: string;
  description?: string;
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export class ConceptMapService {
  private conceptMapRepository = AppDataSource.getRepository(ConceptMap);

  async getAllConceptMaps(): Promise<ConceptMap[]> {
    return await this.conceptMapRepository.find({
      relations: ['nodes'],
      order: { updatedAt: 'DESC' }
    });
  }

  async getConceptMapById(id: string): Promise<ConceptMap | null> {
    return await this.conceptMapRepository.findOne({
      where: { id },
      relations: ['nodes']
    });
  }

  async createConceptMap(data: CreateConceptMapInput): Promise<ConceptMap> {
    const conceptMap = this.conceptMapRepository.create({
      name: data.name,
      description: data.description,
      viewport: { x: 0, y: 0, zoom: 1 }
    });

    return await this.conceptMapRepository.save(conceptMap);
  }

  async updateConceptMap(id: string, data: UpdateConceptMapInput): Promise<ConceptMap> {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.viewport) updateData.viewport = data.viewport;

    await this.conceptMapRepository.update({ id }, updateData);

    const updated = await this.conceptMapRepository.findOne({ where: { id } });
    if (!updated) {
      throw new Error('ConceptMap not found after update');
    }
    return updated;
  }

  async deleteConceptMap(id: string): Promise<void> {
    // This will cascade delete all nodes due to entity relationship
    await this.conceptMapRepository.delete({ id });
  }
}

export const conceptMapService = new ConceptMapService();
