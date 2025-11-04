import { Router } from 'express';
import { edgeController } from '../controllers/edge.controller';

const router = Router();

router.get('/', (req, res) => edgeController.getByConceptMap(req, res));
router.get('/:id', (req, res) => edgeController.getById(req, res));
router.post('/', (req, res) => edgeController.create(req, res));
router.patch('/:id', (req, res) => edgeController.update(req, res));
router.delete('/:id', (req, res) => edgeController.delete(req, res));

export default router;
