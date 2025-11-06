import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Edge } from './entities/Edge';

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: './dev.db',
  entities: [Edge],
  synchronize: true,  // Auto-create schema in development
  logging: process.env.NODE_ENV === 'development',
});
