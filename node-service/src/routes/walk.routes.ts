import { Router } from 'express';
import {
  getWalks,
  getWalk,
  createWalk,
  updateWalk,
  deleteWalk,
  addStep,
  updateStep,
  removeStep,
  reorderSteps
} from '../controllers/walk.controller';

const router = Router();

// Walk CRUD
router.get('/', getWalks);           // GET /walks?conceptMapId=:id
router.get('/:id', getWalk);         // GET /walks/:id
router.post('/', createWalk);        // POST /walks
router.patch('/:id', updateWalk);    // PATCH /walks/:id
router.delete('/:id', deleteWalk);   // DELETE /walks/:id

// Step management
router.put('/:id/steps/reorder', reorderSteps);    // PUT /walks/:id/steps/reorder (before :stepId route!)
router.post('/:id/steps', addStep);                // POST /walks/:id/steps
router.patch('/:id/steps/:stepId', updateStep);    // PATCH /walks/:id/steps/:stepId
router.delete('/:id/steps/:stepId', removeStep);   // DELETE /walks/:id/steps/:stepId

export default router;
