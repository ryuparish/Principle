import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ConceptMap } from './entities/ConceptMap';
import { Node } from './entities/Node';
import { Edge } from './entities/Edge';
import { Walk, WalkStep } from './entities/Walk';
import * as fs from 'fs';
import * as path from 'path';

// Determine database path
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './dev.db';
const absoluteDbPath = path.resolve(dbPath);

// Check if database exists AND has content (not just an empty file)
const dbExists = fs.existsSync(absoluteDbPath);
const dbHasContent = dbExists && fs.statSync(absoluteDbPath).size > 0;

// Use synchronize ONLY for fresh installs to create initial schema
// For existing databases with content, keep synchronize false to prevent auto-modifications
const shouldSynchronize = !dbHasContent;

if (!dbHasContent) {
  console.log(`📝 Fresh database at ${dbPath} - will create schema on connect`);
} else {
  console.log(`📂 Existing database at ${dbPath} (${(fs.statSync(absoluteDbPath).size / 1024).toFixed(1)}KB) - schema sync disabled`);
}

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: dbPath,
  entities: [ConceptMap, Node, Edge, Walk, WalkStep],
  synchronize: shouldSynchronize,
  logging: process.env.NODE_ENV === 'development',
});

// Ensure walk tables exist (handles schema drift when synchronize is false)
export async function ensureWalkTables(): Promise<void> {
  const queryRunner = AppDataSource.createQueryRunner();
  try {
    // Check if walks table exists
    const tables = await queryRunner.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='walks'"
    );

    if (tables.length === 0) {
      console.log('Creating walks tables...');

      await queryRunner.query(`
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

      await queryRunner.query(`
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

      await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_walks_conceptMapId ON walks(conceptMapId)');
      await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_walk_steps_walkId ON walk_steps(walkId)');
      await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_walk_steps_nodeId ON walk_steps(nodeId)');

      console.log('Walk tables created successfully');
    }
  } catch (error) {
    console.error('Failed to ensure walk tables:', error);
  } finally {
    await queryRunner.release();
  }
}
