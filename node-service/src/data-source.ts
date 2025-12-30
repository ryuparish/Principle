import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ConceptMap } from './entities/ConceptMap';
import { Node } from './entities/Node';
import { Edge } from './entities/Edge';
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
  entities: [ConceptMap, Node, Edge],
  synchronize: shouldSynchronize,
  logging: process.env.NODE_ENV === 'development',
});
