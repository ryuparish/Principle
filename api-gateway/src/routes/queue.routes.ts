import { Router } from 'express';
import axios from 'axios';

const router = Router();
const QUEUE_SERVICE_URL = process.env.QUEUE_SERVICE_URL || 'http://localhost:3005';

// Proxy all requests to queue-service
router.post('/publish', async (req, res) => {
  try {
    const response = await axios.post(`${QUEUE_SERVICE_URL}/queue/publish`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Queue service error' });
  }
});

router.get('/status', async (req, res) => {
  try {
    const response = await axios.get(`${QUEUE_SERVICE_URL}/queue/status`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Queue service error' });
  }
});

router.get('/wait-empty', async (req, res) => {
  try {
    const timeout = req.query.timeout || 10000;
    const response = await axios.get(`${QUEUE_SERVICE_URL}/queue/wait-empty`, {
      params: { timeout }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Queue service error' });
  }
});

router.post('/cleanup', async (req, res) => {
  try {
    const response = await axios.post(`${QUEUE_SERVICE_URL}/queue/cleanup`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Queue service error' });
  }
});

export default router;
