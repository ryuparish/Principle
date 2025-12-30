import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Media } from './entities/Media';

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DATABASE_URL?.replace('file:', '') || './dev.db',
  entities: [Media],
  synchronize: false,  // Don't auto-sync (we have existing data)
  logging: process.env.NODE_ENV === 'development',
});
