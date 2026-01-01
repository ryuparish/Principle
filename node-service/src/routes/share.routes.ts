import { Router } from 'express';
import { shareController } from '../controllers/share.controller';

const router = Router();

// Public share endpoints (no auth required)
router.get('/:shareSlug', (req, res) => shareController.getSharedMap(req, res));
router.get('/:shareSlug/download.json', (req, res) => shareController.downloadJSON(req, res));
router.get('/:shareSlug/download.html', (req, res) => shareController.downloadHTML(req, res));

export default router;
