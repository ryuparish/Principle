import { Edge } from '../../node_modules/.prisma/client-edge';
import { prisma } from '../lib/prisma';

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
  async getEdgesByConceptMap(conceptMapId: string): Promise<Edge[]> {
    return prisma.edge.findMany({
      where: { conceptMapId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getEdgeById(id: string): Promise<Edge | null> {
    return prisma.edge.findUnique({
      where: { id }
    });
  }

  async createEdge(data: CreateEdgeInput): Promise<Edge> {
    return prisma.edge.create({
      data: {
        conceptMapId: data.conceptMapId,
        sourceNodeId: data.sourceNodeId,
        targetNodeId: data.targetNodeId,
        label: data.label,
        style: JSON.stringify(data.style || {})
      }
    });
  }

  async updateEdge(id: string, data: UpdateEdgeInput): Promise<Edge> {
    return prisma.edge.update({
      where: { id },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.style !== undefined && { style: JSON.stringify(data.style) })
      }
    });
  }

  async deleteEdge(id: string): Promise<void> {
    await prisma.edge.delete({
      where: { id }
    });
  }
}

export const edgeService = new EdgeService();
