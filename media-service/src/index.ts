import 'reflect-metadata';  // MUST BE FIRST for TypeORM decorators
import express, { Request, Response } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { AppDataSource } from './data-source';
import mediaRoutes from './routes/media.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files from uploads directory
app.use('/media', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'media-service',
    timestamp: new Date().toISOString(),
    database: 'TypeORM + SQLite'
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Principle Media Service',
    version: '1.0.0',
    orm: 'TypeORM',
    endpoints: {
      health: 'GET /health',
      upload: 'POST /upload',
      getById: 'GET /:id',
      serveFile: 'GET /file/:filename',
      getByNode: 'GET /node/:nodeId',
      getBulk: 'GET /bulk?ids=id1,id2,...',
      delete: 'DELETE /:id',
      cleanup: 'POST /cleanup'
    }
  });
});

// Media routes
app.use('/', mediaRoutes);

// Initialize TypeORM and start server
AppDataSource.initialize()
  .then(() => {
    console.log('✅ TypeORM connected to SQLite database');

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Media Service running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ TypeORM connection failed:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  await AppDataSource.destroy();
  process.exit(0);
});
