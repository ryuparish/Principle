import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Edge } from './entities/Edge';
import * as fs from 'fs';
import * as path from 'path';

// Determine database path - use node-service's dev.db as the shared database
const dbPath = process.env.DATABASE_URL?.replace('file:', '') ||
  path.resolve(__dirname, '../../node-service/dev.db');
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
  entities: [Edge],
  synchronize: shouldSynchronize,
  logging: process.env.NODE_ENV === 'development',
});

/**
 * Ensures all required columns exist in the edges table.
 * This handles cases where the entity has new columns but synchronize is false.
 * Call this after AppDataSource.initialize()
 */
export async function ensureEdgeColumns(): Promise<void> {
  const queryRunner = AppDataSource.createQueryRunner();

  try {
    // Get current columns in edges table
    const columns = await queryRunner.query(`PRAGMA table_info(edges)`);
    const columnNames = columns.map((col: any) => col.name);

    // Required columns that might be missing
    const requiredColumns = [
      { name: 'sourceHandleId', type: 'TEXT' },
      { name: 'targetHandleId', type: 'TEXT' },
    ];

    for (const col of requiredColumns) {
      if (!columnNames.includes(col.name)) {
        console.log(`📝 Adding missing column '${col.name}' to edges table`);
        await queryRunner.query(`ALTER TABLE edges ADD COLUMN ${col.name} ${col.type}`);
      }
    }
  } catch (error) {
    console.error('Error ensuring edge columns:', error);
  } finally {
    await queryRunner.release();
  }
}
