/**
 * File Upload Controller
 */

import { Request, Response } from 'express';
import { asyncHandler, AppError } from '@/middleware/errorHandler.js';
import * as fileService from '@/services/file.service.js';
import { logger } from '@/config/logger.js';

/**
 * POST /api/upload
 * Upload and process file
 */
export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'User not authenticated');
  }

  if (!req.file) {
    throw new AppError(400, 'No file uploaded');
  }

  // Check upload limit
  const canUpload = await fileService.checkUploadLimit(req.user.id);
  if (!canUpload) {
    throw new AppError(429, 'Upload limit exceeded. Upgrade to Pro for unlimited uploads.');
  }

  logger.info('File upload started', {
    userId: req.user.id,
    fileName: req.file.originalname,
  });

  // Process file
  const result = await fileService.processFileUpload(req.user.id, req.file);

  // Record usage
  await fileService.recordUsage(req.user.id, 'UPLOAD');

  logger.info('File processed successfully', {
    userId: req.user.id,
    fileId: result.id,
  });

  res.status(200).json({
    success: true,
    message: 'File uploaded and processed successfully',
    data: {
      fileId: result.id,
      textLength: result.extractedText.length,
    },
  });
});

/**
 * GET /api/upload
 * Get user's file uploads
 */
export const getUploads = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'User not authenticated');
  }

  const uploads = await fileService.getUserFileUploads(req.user.id);

  res.status(200).json({
    success: true,
    data: uploads,
  });
});

/**
 * GET /api/upload/:id
 * Get file upload details
 */
export const getUploadById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'User not authenticated');
  }

  const upload = await fileService.getFileUploadById(req.params.id, req.user.id);

  res.status(200).json({
    success: true,
    data: upload,
  });
});

/**
 * DELETE /api/upload/:id
 * Delete file upload
 */
export const deleteUpload = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'User not authenticated');
  }

  await fileService.deleteFileUpload(req.params.id, req.user.id);

  logger.info('File deleted', {
    userId: req.user.id,
    fileId: req.params.id,
  });

  res.status(200).json({
    success: true,
    message: 'File deleted successfully',
  });
});

