import { Router } from 'express';
import { nodeController } from '../controllers/node.controller';

const router = Router();

router.get('/', (req, res) => nodeController.getByConceptMap(req, res));
router.get('/search', (req, res) => nodeController.search(req, res));
router.get('/:id', (req, res) => nodeController.getById(req, res));
router.post('/', (req, res) => nodeController.create(req, res));
router.patch('/:id', (req, res) => nodeController.update(req, res));
router.patch('/:id/undelete', (req, res) => nodeController.undelete(req, res));
router.delete('/:id', (req, res) => nodeController.delete(req, res));

export default router;
