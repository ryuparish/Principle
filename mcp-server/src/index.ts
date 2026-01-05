#!/usr/bin/env node
import 'reflect-metadata';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createDataSource } from './config/database.js';
import { logger } from './config/logging.js';
import { ConceptMapService } from './services/ConceptMapService.js';
import { NodeService } from './services/NodeService.js';
import { EdgeService } from './services/EdgeService.js';
import { LayoutService } from './services/LayoutService.js';
import { StorageService } from './services/StorageService.js';
import { MediaService } from './services/MediaService.js';
import { DriveService } from './services/DriveService.js';
import { WalkService } from './services/WalkService.js';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources/index.js';

async function main() {
  logger.info('Starting Principle Concept Map MCP Server');

  try {
    // Initialize database connection
    logger.debug('Initializing database connection');
    const dataSource = await createDataSource();

    // Initialize services
    logger.debug('Initializing services');
    const mapService = new ConceptMapService(dataSource);
    const layoutService = new LayoutService(dataSource);
    const nodeService = new NodeService(dataSource, layoutService);
    const edgeService = new EdgeService(dataSource);
    const storageService = new StorageService();
    const mediaService = new MediaService(dataSource, storageService);
    const driveService = new DriveService(dataSource);
    const walkService = new WalkService(dataSource);

    // Create MCP server
    logger.debug('Creating MCP server');
    const server = new Server(
      {
        name: 'principle-concept-map',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        }
      }
    );

    // Register tools and resources
    logger.debug('Registering tools');
    registerTools(server, mapService, nodeService, edgeService, layoutService, mediaService, driveService, walkService);

    logger.debug('Registering resources');
    registerResources(server, mapService, nodeService);

    // Connect via stdio transport
    logger.debug('Connecting stdio transport');
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('MCP Server connected and ready');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully');
      await dataSource.destroy();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      await dataSource.destroy();
      process.exit(0);
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', reason as Error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Fatal error starting MCP server', error as Error);
    process.exit(1);
  }
}

main();
