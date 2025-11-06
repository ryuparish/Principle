import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Media } from './entities/Media';

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: './dev.db',
  entities: [Media],
  synchronize: true,  // Auto-create schema in development
  logging: process.env.NODE_ENV === 'development',
});
