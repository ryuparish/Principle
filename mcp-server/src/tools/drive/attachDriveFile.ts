import { DriveService } from '../../services/DriveService.js';
import { logger } from '../../config/logging.js';

interface AttachDriveFileArgs {
  nodeId: string;
  fileId: string;
  name: string;
  mimeType: string;
  iconUrl?: string;
  thumbnailUrl?: string;
  webViewLink?: string;
  size?: number;
}

export async function handleAttachDriveFile(args: unknown, driveService: DriveService) {
  const { nodeId, fileId, name, mimeType, iconUrl, thumbnailUrl, webViewLink, size } = args as AttachDriveFileArgs;

  if (!nodeId || !fileId || !name || !mimeType) {
    return {
      content: [{
        type: 'text' as const,
        text: 'Error: nodeId, fileId, name, and mimeType are required'
      }],
      isError: true
    };
  }

  try {
    const attachment = {
      id: fileId,
      name,
      mimeType,
      iconUrl: iconUrl || '',
      thumbnailUrl,
      webViewLink: webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
      size,
      createdAt: new Date().toISOString()
    };

    const node = await driveService.attachDriveFile(nodeId, attachment);

    const attachments = (node.content as any)?.driveAttachments || [];

    logger.info('Drive file attached via MCP', { nodeId, fileId, name });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: `Attached "${name}" to node`,
          nodeId,
          totalAttachments: attachments.length
        }, null, 2)
      }]
    };
  } catch (error: any) {
    logger.error('Failed to attach Drive file', error);
    return {
      content: [{
        type: 'text' as const,
        text: `Error: ${error.message}`
      }],
      isError: true
    };
  }
}
