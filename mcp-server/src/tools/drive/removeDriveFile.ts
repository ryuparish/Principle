import { DriveService } from '../../services/DriveService.js';
import { logger } from '../../config/logging.js';

interface RemoveDriveFileArgs {
  nodeId: string;
  fileId: string;
}

export async function handleRemoveDriveFile(args: unknown, driveService: DriveService) {
  const { nodeId, fileId } = args as RemoveDriveFileArgs;

  if (!nodeId || !fileId) {
    return {
      content: [{
        type: 'text' as const,
        text: 'Error: nodeId and fileId are required'
      }],
      isError: true
    };
  }

  try {
    const node = await driveService.removeDriveFile(nodeId, fileId);

    const attachments = (node.content as any)?.driveAttachments || [];

    logger.info('Drive file removed via MCP', { nodeId, fileId });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: `Removed Drive file from node`,
          nodeId,
          fileId,
          remainingAttachments: attachments.length
        }, null, 2)
      }]
    };
  } catch (error: any) {
    logger.error('Failed to remove Drive file', error);
    return {
      content: [{
        type: 'text' as const,
        text: `Error: ${error.message}`
      }],
      isError: true
    };
  }
}
