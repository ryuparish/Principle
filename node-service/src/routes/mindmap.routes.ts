import { Router } from 'express';
import { conceptMapController } from '../controllers/mindmap.controller';

const router = Router();

router.get('/', (req, res) => conceptMapController.getAll(req, res));
router.get('/:id', (req, res) => conceptMapController.getById(req, res));
router.post('/', (req, res) => conceptMapController.create(req, res));
router.patch('/:id', (req, res) => conceptMapController.update(req, res));
router.delete('/:id', (req, res) => conceptMapController.delete(req, res));

export default router;
