import { ConceptMap } from '@prisma/client';
import { prisma } from '../lib/prisma';

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
  async getAllConceptMaps(): Promise<ConceptMap[]> {
    return prisma.conceptMap.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { nodes: true }
        }
      }
    });
  }

  async getConceptMapById(id: string): Promise<ConceptMap | null> {
    return prisma.conceptMap.findUnique({
      where: { id },
      include: {
        nodes: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async createConceptMap(data: CreateConceptMapInput): Promise<ConceptMap> {
    return prisma.conceptMap.create({
      data: {
        name: data.name,
        description: data.description,
        viewport: JSON.stringify({ x: 0, y: 0, zoom: 1 })
      }
    });
  }

  async updateConceptMap(id: string, data: UpdateConceptMapInput): Promise<ConceptMap> {
    return prisma.conceptMap.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.viewport && { viewport: JSON.stringify(data.viewport) })
      }
    });
  }

  async deleteConceptMap(id: string): Promise<void> {
    // This will cascade delete all nodes due to Prisma schema
    await prisma.conceptMap.delete({
      where: { id }
    });
  }
}

export const conceptMapService = new ConceptMapService();
