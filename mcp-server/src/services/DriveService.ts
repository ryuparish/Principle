import { DataSource } from 'typeorm';
import { Node } from '../entities/Node.js';
import { logger } from '../config/logging.js';

export interface DriveAttachment {
  id: string;
  name: string;
  mimeType: string;
  iconUrl: string;
  thumbnailUrl?: string;
  webViewLink: string;
  size?: number;
  createdAt: string;
}

export class DriveService {
  private nodeRepository;

  constructor(dataSource: DataSource) {
    this.nodeRepository = dataSource.getRepository(Node);
  }

  /**
   * Attach a Drive file to a node
   */
  async attachDriveFile(nodeId: string, attachment: DriveAttachment): Promise<Node> {
    logger.info('Attaching Drive file to node', { nodeId, fileId: attachment.id, fileName: attachment.name });

    const node = await this.nodeRepository.findOne({
      where: { id: nodeId }
    });

    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    // Get current content
    const content = node.content || {};

    // Get existing attachments or initialize empty array
    const driveAttachments: DriveAttachment[] = (content as any).driveAttachments || [];

    // Check if already attached
    if (driveAttachments.find(a => a.id === attachment.id)) {
      logger.warn('Drive file already attached to node', { nodeId, fileId: attachment.id });
      return node;
    }

    // Add new attachment
    driveAttachments.push(attachment);

    // Update node content
    const updatedContent = {
      ...content,
      driveAttachments
    };

    await this.nodeRepository.update(nodeId, { content: updatedContent });

    // Fetch and return updated node
    const updatedNode = await this.nodeRepository.findOne({
      where: { id: nodeId }
    });

    logger.info('Drive file attached successfully', { nodeId, totalAttachments: driveAttachments.length });

    return updatedNode!;
  }

  /**
   * Remove a Drive file from a node
   */
  async removeDriveFile(nodeId: string, fileId: string): Promise<Node> {
    logger.info('Removing Drive file from node', { nodeId, fileId });

    const node = await this.nodeRepository.findOne({
      where: { id: nodeId }
    });

    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    // Get current content
    const content = node.content || {};
    const driveAttachments: DriveAttachment[] = (content as any).driveAttachments || [];

    // Filter out the attachment to remove
    const updatedAttachments = driveAttachments.filter(a => a.id !== fileId);

    if (updatedAttachments.length === driveAttachments.length) {
      logger.warn('Drive file not found on node', { nodeId, fileId });
    }

    // Update node content
    const updatedContent = {
      ...content,
      driveAttachments: updatedAttachments
    };

    await this.nodeRepository.update(nodeId, { content: updatedContent });

    // Fetch and return updated node
    const updatedNode = await this.nodeRepository.findOne({
      where: { id: nodeId }
    });

    logger.info('Drive file removed successfully', { nodeId, remainingAttachments: updatedAttachments.length });

    return updatedNode!;
  }

  /**
   * List Drive attachments for a node
   */
  async listDriveAttachments(nodeId: string): Promise<DriveAttachment[]> {
    logger.debug('Listing Drive attachments', { nodeId });

    const node = await this.nodeRepository.findOne({
      where: { id: nodeId }
    });

    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    const content = node.content || {};
    const driveAttachments: DriveAttachment[] = (content as any).driveAttachments || [];

    logger.debug('Drive attachments found', { nodeId, count: driveAttachments.length });

    return driveAttachments;
  }
}
