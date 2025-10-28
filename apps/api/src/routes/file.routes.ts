/**
 * File Upload Routes
 */

import { Router } from 'express';
import * as fileController from '@/controllers/file.controller.js';
import { authenticate } from '@/middleware/auth.js';
import { uploadLimiter } from '@/middleware/rateLimiter.js';
import { upload } from '@/config/multer.js';
import { validate, commonSchemas } from '@/middleware/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.post(
  '/',
  uploadLimiter,
  upload.single('file'),
  fileController.uploadFile
);

router.get(
  '/',
  fileController.getUploads
);

router.get(
  '/:id',
  validate({ params: commonSchemas.id }),
  fileController.getUploadById
);

router.delete(
  '/:id',
  validate({ params: commonSchemas.id }),
  fileController.deleteUpload
);

export default router;

