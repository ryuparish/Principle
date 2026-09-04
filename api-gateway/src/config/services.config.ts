export const services = {
  coreGraphService: process.env.CORE_GRAPH_SERVICE_URL || 'http://localhost:8001',
  mediaService: process.env.MEDIA_SERVICE_URL || 'http://localhost:3003',
  aiService: process.env.AI_SERVICE_URL || 'http://localhost:3004'
};
