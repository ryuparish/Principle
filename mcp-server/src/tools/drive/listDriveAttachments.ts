import { DriveService } from '../../services/DriveService.js';
import { logger } from '../../config/logging.js';

interface ListDriveAttachmentsArgs {
  nodeId: string;
}

export async function handleListDriveAttachments(args: unknown, driveService: DriveService) {
  const { nodeId } = args as ListDriveAttachmentsArgs;

  if (!nodeId) {
    return {
      content: [{
        type: 'text' as const,
        text: 'Error: nodeId is required'
      }],
      isError: true
    };
  }

  try {
    const attachments = await driveService.listDriveAttachments(nodeId);

    logger.info('Listed Drive attachments via MCP', { nodeId, count: attachments.length });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          nodeId,
          count: attachments.length,
          attachments: attachments.map(a => ({
            id: a.id,
            name: a.name,
            mimeType: a.mimeType,
            webViewLink: a.webViewLink,
            size: a.size,
            createdAt: a.createdAt
          }))
        }, null, 2)
      }]
    };
  } catch (error: any) {
    logger.error('Failed to list Drive attachments', error);
    return {
      content: [{
        type: 'text' as const,
        text: `Error: ${error.message}`
      }],
      isError: true
    };
  }
}
