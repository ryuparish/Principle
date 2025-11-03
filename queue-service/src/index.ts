import express, { Request, Response } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import queueRoutes from './routes/queue.routes';
import { positionQueue } from './services/queue.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'queue-service',
    timestamp: new Date().toISOString(),
    redis: {
      connected: positionQueue.client.status === 'ready'
    }
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Principle Queue Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      publish: 'POST /queue/publish',
      status: 'GET /queue/status',
      waitEmpty: 'GET /queue/wait-empty',
      cleanup: 'POST /queue/cleanup'
    }
  });
});

// Queue routes
app.use('/queue', queueRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Queue Service running on http://localhost:${PORT}`);
  console.log(`📊 Redis connection: ${positionQueue.client.status}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Queue Service...');
  await positionQueue.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down Queue Service...');
  await positionQueue.close();
  process.exit(0);
});
