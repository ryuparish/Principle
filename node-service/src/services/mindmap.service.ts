import { PrismaClient, Mindmap } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateMindmapInput {
  name: string;
  description?: string;
}

export interface UpdateMindmapInput {
  name?: string;
  description?: string;
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export class MindmapService {
  async getAllMindmaps(): Promise<Mindmap[]> {
    return prisma.mindmap.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { nodes: true }
        }
      }
    });
  }

  async getMindmapById(id: string): Promise<Mindmap | null> {
    return prisma.mindmap.findUnique({
      where: { id },
      include: {
        nodes: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async createMindmap(data: CreateMindmapInput): Promise<Mindmap> {
    return prisma.mindmap.create({
      data: {
        name: data.name,
        description: data.description,
        viewport: { x: 0, y: 0, zoom: 1 }
      }
    });
  }

  async updateMindmap(id: string, data: UpdateMindmapInput): Promise<Mindmap> {
    return prisma.mindmap.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.viewport && { viewport: data.viewport })
      }
    });
  }

  async deleteMindmap(id: string): Promise<void> {
    // This will cascade delete all nodes due to Prisma schema
    await prisma.mindmap.delete({
      where: { id }
    });
  }
}

export const mindmapService = new MindmapService();
