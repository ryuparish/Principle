import { DataSource, Repository } from 'typeorm';
import { Walk, WalkStep } from '../entities/Walk.js';
import { logger } from '../config/logging.js';

export interface CreateWalkInput {
  conceptMapId: string;
  name: string;
  description?: string;
}

export interface UpdateWalkInput {
  name?: string;
  description?: string;
}

export interface CreateStepInput {
  nodeId: string;
  order?: number;
  annotation?: string;
  zoomLevel?: number;
  duration?: number;
}

export interface UpdateStepInput {
  annotation?: string;
  zoomLevel?: number;
  duration?: number;
  order?: number;
}

export interface WalkWithSteps {
  walk: Walk;
  steps: WalkStep[];
}

export class WalkService {
  private walkRepository: Repository<Walk>;
  private stepRepository: Repository<WalkStep>;

  constructor(dataSource: DataSource) {
    this.walkRepository = dataSource.getRepository(Walk);
    this.stepRepository = dataSource.getRepository(WalkStep);
  }

  async getWalksByConceptMap(conceptMapId: string): Promise<WalkWithSteps[]> {
    logger.debug('Getting walks for concept map', { conceptMapId });

    const walks = await this.walkRepository.find({
      where: { conceptMapId },
      order: { createdAt: 'DESC' }
    });

    const result: WalkWithSteps[] = [];
    for (const walk of walks) {
      const steps = await this.stepRepository.find({
        where: { walkId: walk.id },
        order: { order: 'ASC' }
      });
      result.push({ walk, steps });
    }

    return result;
  }

  async getWalkById(id: string): Promise<WalkWithSteps | null> {
    logger.debug('Getting walk by ID', { id });

    const walk = await this.walkRepository.findOne({
      where: { id }
    });

    if (!walk) {
      return null;
    }

    const steps = await this.stepRepository.find({
      where: { walkId: walk.id },
      order: { order: 'ASC' }
    });

    return { walk, steps };
  }

  async createWalk(input: CreateWalkInput): Promise<Walk> {
    logger.info('Creating walk', { name: input.name, mapId: input.conceptMapId });

    const walk = this.walkRepository.create({
      conceptMapId: input.conceptMapId,
      name: input.name,
      description: input.description || null
    });

    return await this.walkRepository.save(walk);
  }

  async updateWalk(id: string, input: UpdateWalkInput): Promise<Walk> {
    logger.info('Updating walk', { id });

    const walk = await this.walkRepository.findOne({ where: { id } });
    if (!walk) {
      throw new Error(`Walk ${id} not found`);
    }

    if (input.name !== undefined) walk.name = input.name;
    if (input.description !== undefined) walk.description = input.description;

    return await this.walkRepository.save(walk);
  }

  async deleteWalk(id: string): Promise<void> {
    logger.info('Deleting walk', { id });

    // Delete steps first (cascade should handle this, but being explicit)
    await this.stepRepository.delete({ walkId: id });

    const result = await this.walkRepository.delete({ id });
    if (result.affected === 0) {
      throw new Error(`Walk ${id} not found`);
    }
  }

  async addStep(walkId: string, input: CreateStepInput): Promise<WalkStep> {
    logger.info('Adding step to walk', { walkId, nodeId: input.nodeId });

    const walk = await this.walkRepository.findOne({ where: { id: walkId } });
    if (!walk) {
      throw new Error(`Walk ${walkId} not found`);
    }

    // If order not specified, append to end
    let order = input.order;
    if (order === undefined) {
      const existingSteps = await this.stepRepository.find({
        where: { walkId },
        order: { order: 'DESC' },
        take: 1
      });
      order = existingSteps.length > 0 ? existingSteps[0].order + 1 : 0;
    }

    const step = this.stepRepository.create({
      walkId,
      nodeId: input.nodeId,
      order,
      annotation: input.annotation || null,
      zoomLevel: input.zoomLevel ?? 1.5,
      duration: input.duration || null
    });

    return await this.stepRepository.save(step);
  }

  async updateStep(stepId: string, input: UpdateStepInput): Promise<WalkStep> {
    logger.info('Updating step', { stepId });

    const step = await this.stepRepository.findOne({ where: { id: stepId } });
    if (!step) {
      throw new Error(`WalkStep ${stepId} not found`);
    }

    if (input.annotation !== undefined) step.annotation = input.annotation;
    if (input.zoomLevel !== undefined) step.zoomLevel = input.zoomLevel;
    if (input.duration !== undefined) step.duration = input.duration;
    if (input.order !== undefined) step.order = input.order;

    return await this.stepRepository.save(step);
  }

  async removeStep(stepId: string): Promise<void> {
    logger.info('Removing step', { stepId });

    const result = await this.stepRepository.delete({ id: stepId });
    if (result.affected === 0) {
      throw new Error(`WalkStep ${stepId} not found`);
    }
  }

  async reorderSteps(walkId: string, stepIds: string[]): Promise<WalkStep[]> {
    logger.info('Reordering steps', { walkId, stepCount: stepIds.length });

    const walk = await this.walkRepository.findOne({ where: { id: walkId } });
    if (!walk) {
      throw new Error(`Walk ${walkId} not found`);
    }

    const updatedSteps: WalkStep[] = [];
    for (let i = 0; i < stepIds.length; i++) {
      const step = await this.stepRepository.findOne({ where: { id: stepIds[i] } });
      if (step && step.walkId === walkId) {
        step.order = i;
        const saved = await this.stepRepository.save(step);
        updatedSteps.push(saved);
      }
    }

    // Sort by order before returning
    return updatedSteps.sort((a, b) => a.order - b.order);
  }

  async getStepById(stepId: string): Promise<WalkStep | null> {
    return await this.stepRepository.findOne({ where: { id: stepId } });
  }
}
