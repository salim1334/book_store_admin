import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

import {
  MAX_AUDIO_SIZE_BYTES,
  MAX_IMAGE_SIZE_BYTES,
  uploadLimits,
  isSupportedAudioType,
  isSupportedImageType,
} from './config/upload-limits';

// Backward-compatible exports (used by existing code/tests).
// Prefer importing from `lib/config/upload-limits.ts` directly in new code.
export const ALLOWED_IMAGE_TYPES = uploadLimits.supportedImageTypes;
export const ALLOWED_AUDIO_TYPES = uploadLimits.supportedAudioTypes;
export const MAX_IMAGE_SIZE = MAX_IMAGE_SIZE_BYTES;
export const MAX_AUDIO_SIZE = MAX_AUDIO_SIZE_BYTES;

export interface UploadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const sanitizedName = nameWithoutExt
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50);
  return `${sanitizedName}_${timestamp}_${random}${ext}`;
}

/**
 * Upload image file
 */
export async function uploadImage(
  file: File,
  bookId: string,
  identifier: string // e.g., chapterId or 'cover'
): Promise<UploadResult> {
  try {
    // Validate file type
    if (!isSupportedImageType(file.type)) {
      return {
        success: false,
        error: `Invalid file type. Supported: ${uploadLimits.supportedImageTypes.join(
          ', '
        )}`,
      };
    }

    // Validate file size
    if (!validateFileSize(file, MAX_IMAGE_SIZE_BYTES)) {
      return {
        success: false,
        error: `File size exceeds ${
          MAX_IMAGE_SIZE_BYTES / 1024 / 1024
        }MB limit.`,
      };
    }

    // Create upload directory
    const uploadDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'images',
      bookId,
      identifier
    );
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.name);
    const filePath = path.join(uploadDir, filename);

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file
    await writeFile(filePath, buffer);

    // Return relative path for database
    const relativePath = `/uploads/images/${bookId}/${identifier}/${filename}`;
    return {
      success: true,
      filePath: relativePath,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: 'Failed to upload image. Please try again.',
    };
  }
}

/**
 * Upload audio file
 */
export async function uploadAudio(
  file: File,
  bookId: string,
  chapterId: string
): Promise<UploadResult> {
  try {
    // Validate file type
    if (!isSupportedAudioType(file.type)) {
      return {
        success: false,
        error: `Invalid file type. Supported: ${uploadLimits.supportedAudioTypes.join(
          ', '
        )}`,
      };
    }

    // Validate file size
    if (!validateFileSize(file, MAX_AUDIO_SIZE_BYTES)) {
      return {
        success: false,
        error: `File size exceeds ${
          MAX_AUDIO_SIZE_BYTES / 1024 / 1024
        }MB limit.`,
      };
    }

    // Create upload directory
    const uploadDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'audio',
      bookId,
      chapterId
    );
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.name);
    const filePath = path.join(uploadDir, filename);

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file
    await writeFile(filePath, buffer);

    // Return relative path for database
    const relativePath = `/uploads/audio/${bookId}/${chapterId}/${filename}`;
    return {
      success: true,
      filePath: relativePath,
    };
  } catch (error) {
    console.error('Error uploading audio:', error);
    return {
      success: false,
      error: 'Failed to upload audio. Please try again.',
    };
  }
}

/**
 * Delete file from filesystem
 */
export async function deleteFile(relativePath: string): Promise<boolean> {
  try {
    const filePath = path.join(process.cwd(), 'public', relativePath);
    if (existsSync(filePath)) {
      await unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}
