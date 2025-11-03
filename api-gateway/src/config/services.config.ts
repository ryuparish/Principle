export const services = {
  nodeService: process.env.NODE_SERVICE_URL || 'http://localhost:3001',
  edgeService: process.env.EDGE_SERVICE_URL || 'http://localhost:3002',
  mediaService: process.env.MEDIA_SERVICE_URL || 'http://localhost:3003',
  aiService: process.env.AI_SERVICE_URL || 'http://localhost:3004'
};
