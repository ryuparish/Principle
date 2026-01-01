import { Router } from 'express';
import { conceptMapController } from '../controllers/mindmap.controller';
import { shareController } from '../controllers/share.controller';

const router = Router();

router.get('/', (req, res) => conceptMapController.getAll(req, res));
router.get('/:id', (req, res) => conceptMapController.getById(req, res));
router.post('/', (req, res) => conceptMapController.create(req, res));
router.patch('/:id', (req, res) => conceptMapController.update(req, res));
router.delete('/:id', (req, res) => conceptMapController.delete(req, res));

// Share management endpoints
router.post('/:id/share', (req, res) => shareController.enableSharing(req, res));
router.get('/:id/share', (req, res) => shareController.getShareSettings(req, res));
router.delete('/:id/share', (req, res) => shareController.disableSharing(req, res));

export default router;
