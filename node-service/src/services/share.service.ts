import { ConceptMap } from '../entities/ConceptMap';
import { Node } from '../entities/Node';
import { AppDataSource } from '../data-source';
import { generateShareSlug, generateShareToken } from '../utils/share.utils';
import axios from 'axios';
import { randomUUID } from 'crypto';

// Service URLs - could be moved to environment variables
const EDGE_SERVICE_URL = process.env.EDGE_SERVICE_URL || 'http://localhost:3002';
const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL || 'http://localhost:3003';

export interface ShareSettings {
  visibility: 'private' | 'public' | 'unlisted';
  shareSlug?: string;
  shareToken?: string;
  shareUrl?: string;
  sharedAt?: Date;
}

export interface EnableSharingInput {
  visibility: 'public' | 'unlisted';
  regenerateSlug?: boolean;
}

export interface ConceptMapExport {
  version: string;
  exportedAt: string;
  map: {
    id: string;
    name: string;
    description?: string;
    viewport: { x: number; y: number; zoom: number };
    createdAt: Date;
    updatedAt: Date;
  };
  nodes: any[];
  edges: any[];
  media: any[];
}

export class ShareService {
  private conceptMapRepository = AppDataSource.getRepository(ConceptMap);
  private nodeRepository = AppDataSource.getRepository(Node);

  /**
   * Enable sharing for a concept map
   * Generates share slug and optional token
   */
  async enableSharing(
    mapId: string,
    options: EnableSharingInput
  ): Promise<ShareSettings> {
    const map = await this.conceptMapRepository.findOneBy({ id: mapId });
    if (!map) {
      throw new Error('Map not found');
    }

    // Generate slug if not exists or regenerate requested
    if (!map.shareSlug || options.regenerateSlug) {
      map.shareSlug = await this.generateUniqueSlug(map.name);
    }

    // Generate token for unlisted maps
    if (options.visibility === 'unlisted' && !map.shareToken) {
      map.shareToken = generateShareToken();
    }

    map.visibility = options.visibility;
    map.sharedAt = new Date();

    await this.conceptMapRepository.save(map);

    const baseUrl = process.env.APP_URL || 'http://localhost:5173';
    // For unlisted maps, include token in URL
    const shareUrl = (map.visibility === 'unlisted' && map.shareToken)
      ? `${baseUrl}/share/${map.shareSlug}?token=${map.shareToken}`
      : `${baseUrl}/share/${map.shareSlug}`;

    return {
      visibility: map.visibility,
      shareSlug: map.shareSlug,
      shareToken: map.shareToken,
      shareUrl,
      sharedAt: map.sharedAt
    };
  }

  /**
   * Disable sharing for a concept map
   */
  async disableSharing(mapId: string): Promise<void> {
    const map = await this.conceptMapRepository.findOneBy({ id: mapId });
    if (!map) {
      throw new Error('Map not found');
    }

    map.visibility = 'private';
    map.shareSlug = undefined;
    map.shareToken = undefined;
    map.sharedAt = undefined;

    await this.conceptMapRepository.save(map);
  }

  /**
   * Get sharing settings for a concept map
   */
  async getShareSettings(mapId: string): Promise<ShareSettings | null> {
    const map = await this.conceptMapRepository.findOneBy({ id: mapId });
    if (!map) {
      throw new Error('Map not found');
    }

    if (map.visibility === 'private' || !map.shareSlug) {
      return null;
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:5173';
    // For unlisted maps, include token in URL
    const shareUrl = (map.visibility === 'unlisted' && map.shareToken)
      ? `${baseUrl}/share/${map.shareSlug}?token=${map.shareToken}`
      : `${baseUrl}/share/${map.shareSlug}`;

    return {
      visibility: map.visibility,
      shareSlug: map.shareSlug,
      shareToken: map.shareToken,
      shareUrl,
      sharedAt: map.sharedAt
    };
  }

  /**
   * Get complete concept map data for sharing
   * Returns JSON export format
   */
  async getSharedMapData(
    shareSlug: string,
    token?: string
  ): Promise<ConceptMapExport> {
    const map = await this.conceptMapRepository.findOne({
      where: { shareSlug },
      relations: ['nodes']
    });

    if (!map) {
      const error: any = new Error('Map not found');
      error.statusCode = 404;
      throw error;
    }

    // Check visibility and token
    if (map.visibility === 'private') {
      const error: any = new Error('This map is not shared');
      error.statusCode = 403;
      throw error;
    }

    if (map.visibility === 'unlisted' && map.shareToken !== token) {
      const error: any = new Error('Invalid share token');
      error.statusCode = 403;
      throw error;
    }

    // Filter out soft-deleted nodes
    const activeNodes = map.nodes.filter(n => !n.isDeleted);

    // Fetch edges from edge-service
    const edges = await this.fetchEdges(map.id);

    // Collect all unique imageIds from nodes
    const allImageIds = new Set<string>();
    activeNodes.forEach(node => {
      if (node.imageIds && Array.isArray(node.imageIds)) {
        node.imageIds.forEach((id: string) => allImageIds.add(id));
      }
    });

    // Fetch media for all imageIds
    const media = await this.fetchMedia(Array.from(allImageIds));

    // Build export object
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      map: {
        id: map.id,
        name: map.name,
        description: map.description,
        viewport: map.viewport,
        createdAt: map.createdAt,
        updatedAt: map.updatedAt
      },
      nodes: activeNodes.map(this.sanitizeNode),
      edges: edges.map(this.sanitizeEdge),
      media: media.map(this.sanitizeMedia)
    };
  }

  /**
   * Generate unique share slug
   * Checks for collisions and retries if needed
   */
  private async generateUniqueSlug(mapName: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const slug = generateShareSlug(mapName);
      const existing = await this.conceptMapRepository.findOneBy({ shareSlug: slug });

      if (!existing) {
        return slug;
      }

      attempts++;
    }

    // Fallback: use UUID-based slug
    return `map-${randomUUID()}`;
  }

  /**
   * Fetch edges from edge-service
   */
  private async fetchEdges(conceptMapId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${EDGE_SERVICE_URL}/edges`, {
        params: { conceptMapId }
      });
      return response.data.edges || [];
    } catch (error) {
      console.error('Failed to fetch edges:', error);
      return [];
    }
  }

  /**
   * Fetch media from media-service
   */
  private async fetchMedia(mediaIds: string[]): Promise<any[]> {
    if (mediaIds.length === 0) return [];

    try {
      const response = await axios.get(`${MEDIA_SERVICE_URL}/media/bulk`, {
        params: { ids: mediaIds.join(',') }
      });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch media:', error);
      return [];
    }
  }

  /**
   * Sanitize node data for export
   * Remove internal fields that shouldn't be exposed
   */
  private sanitizeNode(node: Node): any {
    return {
      id: node.id,
      title: node.title,
      content: node.content,
      position: node.position,
      style: node.style,
      shape: node.shape,
      imageIds: node.imageIds,
      tags: node.tags,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt
      // Excluded: isDeleted, deletedAt, conceptMapId
    };
  }

  /**
   * Sanitize edge data for export
   */
  private sanitizeEdge(edge: any): any {
    return {
      id: edge.id,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      sourceHandleId: edge.sourceHandleId,
      targetHandleId: edge.targetHandleId,
      label: edge.label,
      style: edge.style,
      createdAt: edge.createdAt
      // Excluded: conceptMapId
    };
  }

  /**
   * Sanitize media data for export
   */
  private sanitizeMedia(media: any): any {
    const baseUrl = process.env.MEDIA_BASE_URL || 'http://localhost:3000';

    return {
      id: media.id,
      nodeId: media.nodeId,
      originalName: media.originalName,
      url: `${baseUrl}/api/media/file/${media.filename}`,
      thumbnailUrl: `${baseUrl}/api/media/file/${media.thumbnailFilename}`,
      width: media.width,
      height: media.height
      // Excluded: internal storage paths, uploadedAt
    };
  }
}

export const shareService = new ShareService();
