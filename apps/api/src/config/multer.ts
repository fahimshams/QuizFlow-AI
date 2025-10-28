/**
 * Multer Configuration for File Uploads
 *
 * SECURITY:
 * - Limit file size
 * - Validate file types
 * - Sanitize file names
 * - Store in secure location
 */

import multer from 'multer';
import path from 'path';
import { env } from './env.js';
import { AppError } from '@/middleware/errorHandler.js';

// Create uploads directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_') // Sanitize
      .slice(0, 50); // Limit length
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE, // 10MB
  },
});

