import { Router } from 'express';
import { conceptMapController } from '../controllers/mindmap.controller';
import { shareController } from '../controllers/share.controller';
import { importController } from '../controllers/import.controller';

const router = Router();

router.get('/', (req, res) => conceptMapController.getAll(req, res));
router.post('/', (req, res) => conceptMapController.create(req, res));

// Import endpoint (specific route before /:id)
router.post('/import', (req, res) => importController.importConceptMap(req, res));

// Export endpoint (must come before /:id to avoid route conflicts)
router.get('/:id/export', (req, res) => conceptMapController.export(req, res));

// Share management endpoints (must come before /:id)
router.post('/:id/share', (req, res) => shareController.enableSharing(req, res));
router.get('/:id/share', (req, res) => shareController.getShareSettings(req, res));
router.delete('/:id/share', (req, res) => shareController.disableSharing(req, res));

// Layout endpoint - apply auto-layout using ELKjs
router.post('/:id/layout', (req, res) => conceptMapController.applyLayout(req, res));

// Generic /:id routes (must come AFTER specific routes)
router.get('/:id', (req, res) => conceptMapController.getById(req, res));
router.patch('/:id', (req, res) => conceptMapController.update(req, res));
router.delete('/:id', (req, res) => conceptMapController.delete(req, res));

export default router;
