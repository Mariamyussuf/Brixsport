import { Router } from 'express';
import { downloadsController } from '../../controllers/downloads.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Download a file
router.get('/files/:fileName', downloadsController.downloadFile);

// Generate a signed URL for secure file access
router.get('/files/:fileName/sign', downloadsController.generateSignedUrl);

export default router;