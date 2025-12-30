import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import axios from 'axios';
import mindmapRoutes from './routes/mindmap.routes';
import nodeRoutes from './routes/node.routes';
import edgeRoutes from './routes/edge.routes';
import queueRoutes from './routes/queue.routes';
import mediaRoutes from './routes/media.routes';
import { services } from './config/services.config';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Principle API Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      mindmaps: '/api/mindmaps',
      nodes: '/api/nodes',
      edges: '/api/edges',
      queue: '/api/queue',
      media: '/api/media'
    }
  });
});

// API Routes
app.use('/api/mindmaps', mindmapRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/edges', edgeRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/media', mediaRoutes);

// Check service health on startup
async function checkServicesHealth() {
  console.log('\n🔍 Checking dependent services...\n');

  const checks = [
    { name: 'node-service', url: services.nodeService },
    { name: 'edge-service', url: services.edgeService },
    { name: 'media-service', url: services.mediaService },
    { name: 'ai-service', url: services.aiService },
    { name: 'queue-service', url: services.queueService }
  ];

  for (const { name, url } of checks) {
    try {
      await axios.get(`${url}/health`, { timeout: 2000 });
      console.log(`✅ ${name} (${url}): healthy`);
    } catch {
      console.log(`❌ ${name} (${url}): UNAVAILABLE`);
    }
  }

  console.log('');
}

// Start server with health checks
(async () => {
  await checkServicesHealth();

  app.listen(PORT, () => {
    console.log(`✅ API Gateway running on http://localhost:${PORT}`);
  });
})();
