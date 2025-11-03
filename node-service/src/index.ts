import express, { Request, Response } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import mindmapRoutes from './routes/mindmap.routes';
import nodeRoutes from './routes/node.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'node-service',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Principle Node Service',
    version: '1.0.0',
    endpoints: {
      mindmaps: '/mindmaps',
      nodes: '/nodes'
    }
  });
});

// API Routes
app.use('/mindmaps', mindmapRoutes);
app.use('/nodes', nodeRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Node Service running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
