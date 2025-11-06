import 'reflect-metadata';  // MUST BE FIRST for TypeORM decorators
import express, { Request, Response } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import edgeRoutes from './routes/edge.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'edge-service',
    timestamp: new Date().toISOString(),
    database: 'TypeORM + SQLite'
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Principle Edge Service',
    version: '1.0.0',
    orm: 'TypeORM'
  });
});

// API Routes
app.use('/edges', edgeRoutes);

// Initialize TypeORM and start server
AppDataSource.initialize()
  .then(() => {
    console.log('✅ TypeORM connected to SQLite database');

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Edge Service running on http://localhost:${PORT}`);
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
