import { Router } from 'express';
import { mindmapController } from '../controllers/mindmap.controller';

const router = Router();

router.get('/', (req, res) => mindmapController.getAll(req, res));
router.get('/:id', (req, res) => mindmapController.getById(req, res));
router.post('/', (req, res) => mindmapController.create(req, res));
router.patch('/:id', (req, res) => mindmapController.update(req, res));
router.delete('/:id', (req, res) => mindmapController.delete(req, res));

export default router;
