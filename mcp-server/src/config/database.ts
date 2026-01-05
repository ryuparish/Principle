import { DataSource } from 'typeorm';
import { logger } from './logging.js';
import * as fs from 'fs';

// We'll import entities after they're created/symlinked
let dataSourceInstance: DataSource | null = null;

export async function createDataSource(): Promise<DataSource> {
  if (dataSourceInstance && dataSourceInstance.isInitialized) {
    return dataSourceInstance;
  }

  // Default to node-service's dev.db
  const dbPath = process.env.DATABASE_URL ||
    '/Users/ryuparish/Code/Principle/node-service/dev.db';

  logger.info('Connecting to database', { path: dbPath });

  // Dynamic import of entities to avoid circular dependency issues
  const { Node } = await import('../entities/Node.js');
  const { ConceptMap } = await import('../entities/ConceptMap.js');
  const { Edge } = await import('../entities/Edge.js');
  const { Media } = await import('../entities/Media.js');
  const { Walk, WalkStep } = await import('../entities/Walk.js');

  // Load database file for sql.js
  let database: Uint8Array | undefined;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    database = new Uint8Array(fileBuffer);
    logger.debug('Loaded existing database file', { size: database.length });
  }

  dataSourceInstance = new DataSource({
    type: 'sqljs',
    database: database,
    location: dbPath,
    autoSave: true, // Auto-save changes to the file
    entities: [Node, ConceptMap, Edge, Media, Walk, WalkStep],
    synchronize: false, // Never auto-sync, respect existing schema
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false
  });

  try {
    await dataSourceInstance.initialize();
    logger.info('Database connection established');

    // Ensure media table exists (handles case where it wasn't created)
    await ensureMediaTable(dataSourceInstance);

    // Ensure edge table has all required columns
    await ensureEdgeColumns(dataSourceInstance);

    // Ensure walk tables exist
    await ensureWalkTables(dataSourceInstance);

    return dataSourceInstance;
  } catch (error) {
    logger.error('Database connection failed', error);
    throw error;
  }
}

async function ensureEdgeColumns(dataSource: DataSource): Promise<void> {
  try {
    // Get current columns in edges table
    const columns = await dataSource.query(`PRAGMA table_info(edges)`);
    const columnNames = columns.map((col: any) => col.name);

    // Required columns that might be missing
    const requiredColumns = [
      { name: 'sourceHandleId', type: 'TEXT' },
      { name: 'targetHandleId', type: 'TEXT' },
    ];

    for (const col of requiredColumns) {
      if (!columnNames.includes(col.name)) {
        logger.info(`Adding missing column '${col.name}' to edges table`);
        await dataSource.query(`ALTER TABLE edges ADD COLUMN ${col.name} ${col.type}`);
      }
    }
  } catch (error) {
    logger.error('Failed to ensure edge columns', error);
    // Don't throw - let the app continue even if this fails
  }
}

async function ensureMediaTable(dataSource: DataSource): Promise<void> {
  try {
    // Check if media table exists
    const tables = await dataSource.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='media'"
    );

    if (tables.length === 0) {
      logger.info('Creating media table...');
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS media (
          id TEXT PRIMARY KEY,
          nodeId TEXT,
          filename TEXT UNIQUE,
          thumbnailFilename TEXT,
          originalName TEXT NOT NULL,
          mimeType TEXT NOT NULL,
          sizeBytes INTEGER NOT NULL,
          width INTEGER,
          height INTEGER,
          url TEXT,
          thumbnailUrl TEXT,
          s3Key TEXT,
          s3Url TEXT,
          thumbnailS3Key TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await dataSource.query('CREATE INDEX IF NOT EXISTS idx_media_nodeId ON media(nodeId)');
      await dataSource.query('CREATE INDEX IF NOT EXISTS idx_media_filename ON media(filename)');
      logger.info('Media table created successfully');
    }
  } catch (error) {
    logger.error('Failed to ensure media table', error);
    // Don't throw - let the app continue even if this fails
  }
}

async function ensureWalkTables(dataSource: DataSource): Promise<void> {
  try {
    // Check if walks table exists
    const walkTables = await dataSource.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='walks'"
    );

    if (walkTables.length === 0) {
      logger.info('Creating walks table...');
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS walks (
          id TEXT PRIMARY KEY,
          conceptMapId TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (conceptMapId) REFERENCES mindmaps(id) ON DELETE CASCADE
        )
      `);
      await dataSource.query('CREATE INDEX IF NOT EXISTS idx_walks_conceptMapId ON walks(conceptMapId)');
      logger.info('Walks table created successfully');
    }

    // Check if walk_steps table exists
    const stepTables = await dataSource.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='walk_steps'"
    );

    if (stepTables.length === 0) {
      logger.info('Creating walk_steps table...');
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS walk_steps (
          id TEXT PRIMARY KEY,
          walkId TEXT NOT NULL,
          nodeId TEXT NOT NULL,
          "order" INTEGER NOT NULL,
          annotation TEXT,
          zoomLevel REAL DEFAULT 1.5,
          duration INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (walkId) REFERENCES walks(id) ON DELETE CASCADE,
          FOREIGN KEY (nodeId) REFERENCES nodes(id) ON DELETE CASCADE
        )
      `);
      await dataSource.query('CREATE INDEX IF NOT EXISTS idx_walk_steps_walkId ON walk_steps(walkId)');
      await dataSource.query('CREATE INDEX IF NOT EXISTS idx_walk_steps_nodeId ON walk_steps(nodeId)');
      logger.info('Walk_steps table created successfully');
    }
  } catch (error) {
    logger.error('Failed to ensure walk tables', error);
    // Don't throw - let the app continue even if this fails
  }
}

export async function closeDataSource(): Promise<void> {
  if (dataSourceInstance && dataSourceInstance.isInitialized) {
    await dataSourceInstance.destroy();
    dataSourceInstance = null;
    logger.info('Database connection closed');
  }
}
