import { Router } from 'express';
import { mediaController } from '../../controllers/media.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// File Upload Management
router.post('/upload', mediaController.initiateUpload);
router.post('/upload/presigned-url/:id', mediaController.generatePresignedUrl);
router.post('/upload/complete/:id', mediaController.completeUpload);
router.post('/upload/cancel/:id', mediaController.cancelUpload);

// File Retrieval & Management
router.get('/:id', mediaController.getMediaFile);
router.get('/:id/download', mediaController.downloadMediaFile);
router.get('/', mediaController.listMediaFiles);
router.put('/:id', mediaController.updateMediaFile);
router.delete('/:id', mediaController.deleteMediaFile);

// Processing & Optimization
router.post('/:id/process', mediaController.processMedia);
router.get('/:id/thumbnails', mediaController.getThumbnails);
router.post('/:id/resize', mediaController.resizeMedia);
router.post('/:id/convert', mediaController.convertMedia);

// Batch Operations
router.post('/batch', mediaController.batchUpload);
router.delete('/batch', mediaController.batchDelete);
router.put('/batch/metadata', mediaController.batchUpdateMetadata);

export default router;