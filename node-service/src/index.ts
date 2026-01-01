import 'reflect-metadata';  // MUST BE FIRST for TypeORM decorators
import express, { Request, Response } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import mindmapRoutes from './routes/mindmap.routes';
import nodeRoutes from './routes/node.routes';
import shareRoutes from './routes/share.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'node-service',
    timestamp: new Date().toISOString(),
    database: 'TypeORM + SQLite'
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Principle Node Service',
    version: '1.0.0',
    orm: 'TypeORM',
    endpoints: {
      mindmaps: '/mindmaps',
      nodes: '/nodes',
      share: '/share'
    }
  });
});

// API Routes
app.use('/mindmaps', mindmapRoutes);
app.use('/nodes', nodeRoutes);
app.use('/share', shareRoutes);

// Initialize TypeORM and start server
AppDataSource.initialize()
  .then(() => {
    console.log('✅ TypeORM connected to SQLite database');

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Node Service running on http://localhost:${PORT}`);
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
