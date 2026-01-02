import { ConceptMapExport } from './share.service';
import { ConceptMap } from '../entities/ConceptMap';
import { Node } from '../entities/Node';
import { AppDataSource } from '../data-source';
import axios from 'axios';
import { randomUUID } from 'crypto';

// Service URLs
const EDGE_SERVICE_URL = process.env.EDGE_SERVICE_URL || 'http://localhost:3002';
const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL || 'http://localhost:3003';

export class ImportService {
  private conceptMapRepository = AppDataSource.getRepository(ConceptMap);
  private nodeRepository = AppDataSource.getRepository(Node);

  /**
   * Import a concept map from exported JSON
   * Creates a new map with new UUIDs (avoids conflicts)
   */
  async importConceptMap(data: ConceptMapExport): Promise<ConceptMap> {
    // Validate data format
    this.validateImportData(data);

    // Generate new IDs to avoid conflicts
    const idMapping = this.generateIdMapping(data);
    const mediaMapping = this.generateMediaMapping(data);

    // Create the concept map
    const newMap = await this.createConceptMap(data, idMapping);

    // Create media BEFORE nodes (nodes reference media)
    await this.createMedia(data, mediaMapping, newMap.id);

    // Create nodes with new IDs and mapped media IDs
    await this.createNodes(data, idMapping, mediaMapping, newMap.id);

    // Create edges with mapped IDs
    await this.createEdges(data, idMapping, newMap.id);

    // Return the newly created map
    return newMap;
  }

  /**
   * Validate that the import data has all required fields
   */
  private validateImportData(data: ConceptMapExport): void {
    if (!data.version) {
      throw new Error('Invalid export: missing version');
    }
    if (!data.map) {
      throw new Error('Invalid export: missing map data');
    }
    if (!data.map.id || !data.map.name) {
      throw new Error('Invalid export: map must have id and name');
    }
    if (!data.nodes) {
      throw new Error('Invalid export: missing nodes');
    }
    if (!data.edges) {
      throw new Error('Invalid export: missing edges');
    }
    // Media is optional
  }

  /**
   * Generate mapping from old IDs to new UUIDs
   * This prevents ID conflicts when importing
   */
  private generateIdMapping(data: ConceptMapExport): Map<string, string> {
    const mapping = new Map<string, string>();

    // Map old map ID to new map ID
    mapping.set(data.map.id, randomUUID());

    // Map old node IDs to new node IDs
    data.nodes.forEach(node => {
      mapping.set(node.id, randomUUID());
    });

    // Edges don't need their own mapping (they reference nodes)

    return mapping;
  }

  /**
   * Generate mapping from old media IDs to new UUIDs
   */
  private generateMediaMapping(data: ConceptMapExport): Map<string, string> {
    const mapping = new Map<string, string>();

    if (data.media && Array.isArray(data.media)) {
      data.media.forEach(media => {
        mapping.set(media.id, randomUUID());
      });
    }

    return mapping;
  }

  /**
   * Create the concept map with a new ID
   */
  private async createConceptMap(
    data: ConceptMapExport,
    idMapping: Map<string, string>
  ): Promise<ConceptMap> {
    const newMap = this.conceptMapRepository.create({
      id: idMapping.get(data.map.id),
      name: data.map.name + ' (Imported)',
      description: data.map.description,
      viewport: data.map.viewport || { x: 0, y: 0, zoom: 1 },
      visibility: 'private', // Imported maps are private by default
    });

    return await this.conceptMapRepository.save(newMap);
  }

  /**
   * Create all nodes with new IDs
   */
  private async createNodes(
    data: ConceptMapExport,
    idMapping: Map<string, string>,
    mediaMapping: Map<string, string>,
    newMapId: string
  ): Promise<void> {
    const nodes = data.nodes.map(node => {
      // Map old imageIds to new media IDs
      const mappedImageIds = (node.imageIds || [])
        .map((oldId: string) => mediaMapping.get(oldId))
        .filter((id: string | undefined): id is string => id !== undefined);

      return this.nodeRepository.create({
        id: idMapping.get(node.id),
        conceptMapId: newMapId,
        title: node.title || 'Untitled Node',
        content: node.content || {},
        position: node.position || { x: 0, y: 0 },
        style: node.style || {},
        shape: node.shape || 'rounded-rectangle',
        imageIds: mappedImageIds,
        tags: node.tags || [],
        isDeleted: false, // Don't import deleted nodes
      });
    });

    await this.nodeRepository.save(nodes);
  }

  /**
   * Create media records by importing from source storage
   * Supports both local and S3 storage modes
   */
  private async createMedia(
    data: ConceptMapExport,
    mediaMapping: Map<string, string>,
    newMapId: string
  ): Promise<void> {
    if (!data.media || data.media.length === 0) {
      return; // No media to import
    }

    const useS3 = process.env.USE_S3_STORAGE === 'true';

    for (const media of data.media) {
      const newMediaId = mediaMapping.get(media.id);
      if (!newMediaId) {
        console.warn(`No mapping found for media ${media.id}`);
        continue;
      }

      try {
        if (media.storageMode === 's3' && media.s3Url) {
          // S3 -> S3: Download and re-upload
          await this.importFromS3(newMediaId, media);
        } else if (media.storageMode === 'local' && media.filename) {
          // Local -> Local: Copy files
          await this.importFromLocal(newMediaId, media);
        } else if (useS3 && media.filename) {
          // Local -> S3: Upload local file to S3
          await this.migrateLocalToS3(newMediaId, media);
        } else if (!useS3 && media.s3Url) {
          // S3 -> Local: Download S3 file to local
          await this.migrateS3ToLocal(newMediaId, media);
        } else {
          console.warn(`Cannot import media ${media.id}: incompatible storage mode`);
        }
      } catch (error: any) {
        console.error(`Failed to import media ${media.id}:`, error.message);
        // Continue with other media even if one fails
      }
    }
  }

  /**
   * Import from local files (Local -> Local)
   */
  private async importFromLocal(newId: string, media: any): Promise<void> {
    await axios.post(`${MEDIA_SERVICE_URL}/import-local`, {
      id: newId,
      sourceFilename: media.filename,
      sourceThumbnail: media.thumbnailFilename,
      originalName: media.originalName,
      mimeType: media.mimeType,
      width: media.width,
      height: media.height
    });
  }

  /**
   * Import from S3 (S3 -> S3)
   */
  private async importFromS3(newId: string, media: any): Promise<void> {
    await axios.post(`${MEDIA_SERVICE_URL}/import-s3`, {
      id: newId,
      sourceUrl: media.s3Url,
      originalName: media.originalName,
      mimeType: media.mimeType,
      width: media.width,
      height: media.height
    });
  }

  /**
   * Migrate: Local file -> S3
   */
  private async migrateLocalToS3(newId: string, media: any): Promise<void> {
    await axios.post(`${MEDIA_SERVICE_URL}/migrate-to-s3`, {
      id: newId,
      sourceFilename: media.filename,
      sourceThumbnail: media.thumbnailFilename,
      originalName: media.originalName,
      mimeType: media.mimeType,
      width: media.width,
      height: media.height
    });
  }

  /**
   * Migrate: S3 URL -> Local file
   */
  private async migrateS3ToLocal(newId: string, media: any): Promise<void> {
    await axios.post(`${MEDIA_SERVICE_URL}/migrate-to-local`, {
      id: newId,
      sourceUrl: media.s3Url,
      originalName: media.originalName,
      mimeType: media.mimeType,
      width: media.width,
      height: media.height
    });
  }

  /**
   * Create all edges with mapped node IDs
   */
  private async createEdges(
    data: ConceptMapExport,
    idMapping: Map<string, string>,
    newMapId: string
  ): Promise<void> {
    if (!data.edges || data.edges.length === 0) {
      return; // No edges to create
    }

    const edges = data.edges.map(edge => ({
      id: randomUUID(),
      conceptMapId: newMapId,
      sourceNodeId: idMapping.get(edge.sourceNodeId)!,
      targetNodeId: idMapping.get(edge.targetNodeId)!,
      sourceHandleId: edge.sourceHandleId || 'default',
      targetHandleId: edge.targetHandleId || 'default',
      label: edge.label || '',
      style: edge.style || {},
    }));

    // Call edge-service to create edges
    try {
      for (const edge of edges) {
        await axios.post(`${EDGE_SERVICE_URL}/edges`, edge);
      }
    } catch (error: any) {
      console.error('Failed to create edges during import:', error.message);
      throw new Error('Failed to create edges: ' + error.message);
    }
  }
}

export const importService = new ImportService();
