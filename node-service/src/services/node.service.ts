import { PrismaClient, Node } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateNodeInput {
  mindmapId: string;
  title: string;
  content?: any;
  position: {
    x: number;
    y: number;
  };
  style?: any;
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
}

export class NodeService {
  async getNodesByMindmap(mindmapId: string): Promise<Node[]> {
    return prisma.node.findMany({
      where: {
        mindmapId,
        isDeleted: false
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getNodeById(id: string): Promise<Node | null> {
    return prisma.node.findUnique({
      where: { id }
    });
  }

  async createNode(data: CreateNodeInput): Promise<Node> {
    return prisma.node.create({
      data: {
        mindmapId: data.mindmapId,
        title: data.title,
        content: data.content || {},
        position: data.position,
        style: data.style || {}
      }
    });
  }

  async updateNode(id: string, data: UpdateNodeInput): Promise<Node> {
    return prisma.node.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.position !== undefined && { position: data.position }),
        ...(data.style !== undefined && { style: data.style }),
        ...(data.imageIds !== undefined && { imageIds: data.imageIds }),
        ...(data.tags !== undefined && { tags: data.tags })
      }
    });
  }

  async deleteNode(id: string): Promise<void> {
    // Soft delete
    await prisma.node.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });
  }

  async searchNodes(mindmapId: string, query: string): Promise<Node[]> {
    return prisma.node.findMany({
      where: {
        mindmapId,
        isDeleted: false,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          // Note: Searching in JSONB requires raw SQL for complex queries
          // For MVP, we'll just search titles
        ]
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });
  }
}

export const nodeService = new NodeService();
