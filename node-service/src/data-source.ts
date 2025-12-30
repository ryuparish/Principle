import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ConceptMap } from './entities/ConceptMap';
import { Node } from './entities/Node';
import { Edge } from './entities/Edge';

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DATABASE_URL?.replace('file:', '') || './dev.db',
  entities: [ConceptMap, Node, Edge],
  synchronize: false,  // Don't auto-sync (we have existing data)
  logging: process.env.NODE_ENV === 'development',
});
