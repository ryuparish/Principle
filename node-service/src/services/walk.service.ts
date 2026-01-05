import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Walk, WalkStep } from '../entities/Walk';
import { v4 as uuidv4 } from 'uuid';

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
  order: number;
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

class WalkService {
  private walkRepository: Repository<Walk>;
  private stepRepository: Repository<WalkStep>;

  constructor() {
    this.walkRepository = AppDataSource.getRepository(Walk);
    this.stepRepository = AppDataSource.getRepository(WalkStep);
  }

  // Walk CRUD operations

  async getWalksByConceptMap(conceptMapId: string): Promise<Walk[]> {
    return this.walkRepository.find({
      where: { conceptMapId },
      relations: ['steps'],
      order: { createdAt: 'DESC' }
    });
  }

  async getWalkById(id: string): Promise<Walk | null> {
    const walk = await this.walkRepository.findOne({
      where: { id },
      relations: ['steps']
    });

    if (walk && walk.steps) {
      // Sort steps by order
      walk.steps.sort((a, b) => a.order - b.order);
    }

    return walk;
  }

  async createWalk(input: CreateWalkInput): Promise<Walk> {
    const walk = this.walkRepository.create({
      id: uuidv4(),
      conceptMapId: input.conceptMapId,
      name: input.name,
      description: input.description || null,
      steps: []
    });

    return this.walkRepository.save(walk);
  }

  async updateWalk(id: string, input: UpdateWalkInput): Promise<Walk> {
    const walk = await this.getWalkById(id);
    if (!walk) {
      throw new Error(`Walk ${id} not found`);
    }

    if (input.name !== undefined) walk.name = input.name;
    if (input.description !== undefined) walk.description = input.description;

    return this.walkRepository.save(walk);
  }

  async deleteWalk(id: string): Promise<void> {
    const result = await this.walkRepository.delete({ id });
    if (result.affected === 0) {
      throw new Error(`Walk ${id} not found`);
    }
  }

  // Step management operations

  async addStep(walkId: string, input: CreateStepInput): Promise<WalkStep> {
    const walk = await this.getWalkById(walkId);
    if (!walk) {
      throw new Error(`Walk ${walkId} not found`);
    }

    const step = this.stepRepository.create({
      id: uuidv4(),
      walkId,
      nodeId: input.nodeId,
      order: input.order,
      annotation: input.annotation || null,
      zoomLevel: input.zoomLevel ?? 1.5,
      duration: input.duration || null
    });

    return this.stepRepository.save(step);
  }

  async updateStep(stepId: string, input: UpdateStepInput): Promise<WalkStep> {
    const step = await this.stepRepository.findOne({ where: { id: stepId } });
    if (!step) {
      throw new Error(`WalkStep ${stepId} not found`);
    }

    if (input.annotation !== undefined) step.annotation = input.annotation;
    if (input.zoomLevel !== undefined) step.zoomLevel = input.zoomLevel;
    if (input.duration !== undefined) step.duration = input.duration;
    if (input.order !== undefined) step.order = input.order;

    return this.stepRepository.save(step);
  }

  async removeStep(stepId: string): Promise<void> {
    const result = await this.stepRepository.delete({ id: stepId });
    if (result.affected === 0) {
      throw new Error(`WalkStep ${stepId} not found`);
    }
  }

  async reorderSteps(walkId: string, stepIds: string[]): Promise<WalkStep[]> {
    const walk = await this.getWalkById(walkId);
    if (!walk) {
      throw new Error(`Walk ${walkId} not found`);
    }

    // Update each step's order based on position in stepIds array
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

  // Utility: Get step by ID
  async getStepById(stepId: string): Promise<WalkStep | null> {
    return this.stepRepository.findOne({ where: { id: stepId } });
  }

  // Utility: Remove steps referencing a deleted node
  async removeStepsByNodeId(nodeId: string): Promise<number> {
    const result = await this.stepRepository.delete({ nodeId });
    return result.affected || 0;
  }
}

export const walkService = new WalkService();
