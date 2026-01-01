import { ConceptMapExport } from './share.service';
import { ConceptMap } from '../entities/ConceptMap';
import { Node } from '../entities/Node';
import { AppDataSource } from '../data-source';
import axios from 'axios';
import { randomUUID } from 'crypto';

// Service URLs
const EDGE_SERVICE_URL = process.env.EDGE_SERVICE_URL || 'http://localhost:3002';

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

    // Create the concept map
    const newMap = await this.createConceptMap(data, idMapping);

    // Create nodes with new IDs
    await this.createNodes(data, idMapping, newMap.id);

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
    newMapId: string
  ): Promise<void> {
    const nodes = data.nodes.map(node => {
      return this.nodeRepository.create({
        id: idMapping.get(node.id),
        conceptMapId: newMapId,
        title: node.title || 'Untitled Node',
        content: node.content || {},
        position: node.position || { x: 0, y: 0 },
        style: node.style || {},
        shape: node.shape || 'rounded-rectangle',
        imageIds: node.imageIds || [],
        tags: node.tags || [],
        isDeleted: false, // Don't import deleted nodes
      });
    });

    await this.nodeRepository.save(nodes);
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
