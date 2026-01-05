import { DataSource, Repository } from 'typeorm';
import { ConceptMap } from '../entities/ConceptMap.js';
import { logger } from '../config/logging.js';

export interface CreateMapInput {
  name: string;
  description?: string;
}

export interface UpdateMapInput {
  name?: string;
  description?: string;
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export class ConceptMapService {
  private mapRepository: Repository<ConceptMap>;

  constructor(dataSource: DataSource) {
    this.mapRepository = dataSource.getRepository(ConceptMap);
  }

  async getAllMaps(): Promise<ConceptMap[]> {
    logger.debug('Fetching all concept maps');
    return await this.mapRepository
      .createQueryBuilder('conceptMap')
      .leftJoinAndSelect('conceptMap.nodes', 'node', 'node.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('conceptMap.updatedAt', 'DESC')
      .getMany();
  }

  async getMapById(id: string): Promise<ConceptMap | null> {
    logger.debug('Fetching concept map', { id });
    return await this.mapRepository
      .createQueryBuilder('conceptMap')
      .leftJoinAndSelect('conceptMap.nodes', 'node', 'node.isDeleted = :isDeleted', { isDeleted: false })
      .where('conceptMap.id = :id', { id })
      .getOne();
  }

  async createMap(input: CreateMapInput): Promise<ConceptMap> {
    logger.info('Creating concept map', { name: input.name });

    const map = this.mapRepository.create({
      name: input.name,
      description: input.description,
      viewport: { x: 0, y: 0, zoom: 1 }
    });

    return await this.mapRepository.save(map);
  }

  async updateMap(id: string, input: UpdateMapInput): Promise<ConceptMap> {
    logger.info('Updating concept map', { id });

    const map = await this.getMapById(id);
    if (!map) {
      throw new Error(`Concept map ${id} not found`);
    }

    if (input.name !== undefined) map.name = input.name;
    if (input.description !== undefined) map.description = input.description;
    if (input.viewport !== undefined) map.viewport = input.viewport;

    return await this.mapRepository.save(map);
  }

  async deleteMap(id: string): Promise<void> {
    logger.info('Deleting concept map', { id });

    const result = await this.mapRepository.delete({ id });

    if (result.affected === 0) {
      throw new Error(`Concept map ${id} not found`);
    }
  }

  async getMapStatistics(id: string) {
    const map = await this.getMapById(id);
    if (!map) {
      throw new Error(`Concept map ${id} not found`);
    }

    const nodeCount = map.nodes?.length || 0;
    const portalCount = map.nodes?.filter(n => n.nodeType === 'portal').length || 0;
    const tagSet = new Set(map.nodes?.flatMap(n => n.tags || []));

    return {
      mapId: id,
      name: map.name,
      description: map.description,
      nodeCount,
      portalNodeCount: portalCount,
      regularNodeCount: nodeCount - portalCount,
      uniqueTags: Array.from(tagSet),
      createdAt: map.createdAt,
      updatedAt: map.updatedAt
    };
  }
}
