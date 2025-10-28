/**
 * File Upload Service
 *
 * SECURITY CONSIDERATIONS:
 * - Validate file types
 * - Limit file sizes
 * - Sanitize file names
 * - Store files securely
 * - Scan for malware (in production)
 */

import fs from 'fs/promises';
import path from 'path';
import { AppError } from '@/middleware/errorHandler.js';
import { prisma } from '@/config/database.js';
import { env } from '@/config/env.js';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { FileType, UploadStatus } from '@prisma/client';

/**
 * Process uploaded file and extract text
 */
export const processFileUpload = async (
  userId: string,
  file: Express.Multer.File
): Promise<{ id: string; extractedText: string }> => {
  // Validate file type
  const fileType = getFileType(file.mimetype);
  if (!fileType) {
    throw new AppError(400, 'Invalid file type. Only PDF, DOCX, and TXT are allowed');
  }

  // Create file upload record
  const fileUpload = await prisma.fileUpload.create({
    data: {
      userId,
      fileName: file.filename,
      originalName: file.originalname,
      fileType,
      fileSize: file.size,
      filePath: file.path,
      status: UploadStatus.PROCESSING,
    },
  });

  try {
    // Extract text based on file type
    let extractedText: string;

    switch (fileType) {
      case FileType.PDF:
        extractedText = await extractTextFromPDF(file.path);
        break;
      case FileType.DOCX:
        extractedText = await extractTextFromDOCX(file.path);
        break;
      case FileType.TXT:
        extractedText = await extractTextFromTXT(file.path);
        break;
      default:
        throw new AppError(400, 'Unsupported file type');
    }

    // Validate extracted text
    if (!extractedText || extractedText.trim().length < 100) {
      throw new AppError(400, 'File content too short or empty. Please upload a file with at least 100 characters.');
    }

    // Update file upload record
    await prisma.fileUpload.update({
      where: { id: fileUpload.id },
      data: {
        extractedText,
        status: UploadStatus.COMPLETED,
      },
    });

    return {
      id: fileUpload.id,
      extractedText,
    };
  } catch (error) {
    // Update status to failed
    await prisma.fileUpload.update({
      where: { id: fileUpload.id },
      data: {
        status: UploadStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
};

/**
 * Get file type from MIME type
 */
function getFileType(mimetype: string): FileType | null {
  const typeMap: Record<string, FileType> = {
    'application/pdf': FileType.PDF,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileType.DOCX,
    'text/plain': FileType.TXT,
  };

  return typeMap[mimetype] || null;
}

/**
 * Extract text from PDF
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

/**
 * Extract text from DOCX
 */
async function extractTextFromDOCX(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

/**
 * Extract text from TXT
 */
async function extractTextFromTXT(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8');
}

/**
 * Get file upload by ID
 */
export const getFileUploadById = async (fileId: string, userId: string) => {
  const fileUpload = await prisma.fileUpload.findFirst({
    where: {
      id: fileId,
      userId,
    },
  });

  if (!fileUpload) {
    throw new AppError(404, 'File not found');
  }

  return fileUpload;
};

/**
 * Get user's file uploads
 */
export const getUserFileUploads = async (userId: string) => {
  return await prisma.fileUpload.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      fileName: true,
      originalName: true,
      fileType: true,
      fileSize: true,
      status: true,
      createdAt: true,
    },
  });
};

/**
 * Delete file upload
 */
export const deleteFileUpload = async (fileId: string, userId: string) => {
  const fileUpload = await getFileUploadById(fileId, userId);

  // Delete physical file
  try {
    await fs.unlink(fileUpload.filePath);
  } catch (error) {
    // Log error but don't fail (file might already be deleted)
    console.error('Error deleting file:', error);
  }

  // Delete database record
  await prisma.fileUpload.delete({
    where: { id: fileId },
  });
};

/**
 * Check usage limits
 */
export const checkUploadLimit = async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      usage: {
        where: {
          action: 'UPLOAD',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Free plan: 1 upload per week
  if (user.plan === 'FREE') {
    return user.usage.length < 1;
  }

  // Pro plan: unlimited
  return true;
};

/**
 * Record usage
 */
export const recordUsage = async (
  userId: string,
  action: 'UPLOAD' | 'QUIZ_GENERATION' | 'QTI_EXPORT'
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  await prisma.usageRecord.create({
    data: {
      userId,
      action,
      plan: user.plan,
    },
  });
};

