import { Router } from 'express';
import { mediaController } from '../controllers/media.controller';
import { upload } from '../middleware/multer.config';

const router = Router();

// Upload image
router.post('/upload', upload.single('image'), (req, res) =>
  mediaController.upload(req, res)
);

// Cleanup orphaned media (specific path before /:id)
router.post('/cleanup', (req, res) => mediaController.cleanup(req, res));

// Import endpoints (specific paths before /:id)
router.post('/import-local', (req, res) => mediaController.importLocal(req, res));
router.post('/import-s3', (req, res) => mediaController.importS3(req, res));
router.post('/migrate-to-s3', (req, res) => mediaController.migrateToS3(req, res));
router.post('/migrate-to-local', (req, res) => mediaController.migrateToLocal(req, res));

// Get media by IDs (bulk) (specific path before /:id)
router.get('/bulk', (req, res) => mediaController.getByIds(req, res));

// Serve file (specific path before /:id)
router.get('/file/:filename', (req, res) => mediaController.serveFile(req, res));

// Get media by node (specific path before /:id)
router.get('/node/:nodeId', (req, res) => mediaController.getByNode(req, res));

// Get media by ID (generic, must come after specific routes)
router.get('/:id', (req, res) => mediaController.getById(req, res));

// Delete media (generic, must come after specific routes)
router.delete('/:id', (req, res) => mediaController.delete(req, res));

export default router;
