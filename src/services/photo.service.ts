import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ENV } from '../config/env.js';
import { AppError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

// Ensure photo directory exists
if (!fs.existsSync(ENV.PHOTO_UPLOAD_DIR)) {
  fs.mkdirSync(ENV.PHOTO_UPLOAD_DIR, { recursive: true });
}

// Multer memory storage
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: ENV.MAX_PHOTO_SIZE_BYTES, // Max 5 MB raw input
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(
        new AppError(
          400,
          'INVALID_IMAGE_TYPE',
          'upload.invalid_type',
          'Only JPEG, PNG, or WebP images are accepted.'
        )
      );
    }
    cb(null, true);
  },
});

export interface ProcessedPhotoResult {
  fileName: string;
  filePath: string;
  photoUrl: string;
  sizeBytes: number;
}

/**
 * Strips EXIF metadata (privacy), resizes, and compresses to under 300 KB.
 */
export async function processAndSavePhoto(buffer: Buffer): Promise<ProcessedPhotoResult> {
  const fileId = crypto.randomUUID();
  const fileName = `${fileId}.jpg`;
  const targetPath = path.join(ENV.PHOTO_UPLOAD_DIR, fileName);

  try {
    // Sharp pipeline:
    // .rotate() reads EXIF orientation then strips all EXIF metadata tags (GPS, camera model, etc.)
    // Resize down if larger than 1200px width/height while maintaining aspect ratio
    let quality = 80;
    let outputBuffer = await sharp(buffer)
      .rotate()
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, progressive: true, mozjpeg: true })
      .toBuffer();

    // If still larger than 300 KB, compress further
    if (outputBuffer.length > 300 * 1024) {
      quality = 65;
      outputBuffer = await sharp(buffer)
        .rotate()
        .resize(1000, 1000, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality, progressive: true, mozjpeg: true })
        .toBuffer();
    }

    // Save compressed, stripped file
    await fs.promises.writeFile(targetPath, outputBuffer);

    return {
      fileName,
      filePath: targetPath,
      photoUrl: `/uploads/photos/${fileName}`,
      sizeBytes: outputBuffer.length,
    };
  } catch (error: any) {
    logger.error({ error: error.message }, 'Sharp photo processing failed');
    throw new AppError(
      500,
      'PHOTO_PROCESSING_FAILED',
      'upload.processing_failed',
      'Could not process check-in photo.'
    );
  }
}

/**
 * Deletes photos older than 30 days for data retention compliance
 */
export async function cleanupExpiredPhotos(retentionDays = 30): Promise<number> {
  let deletedCount = 0;
  try {
    const files = await fs.promises.readdir(ENV.PHOTO_UPLOAD_DIR);
    const now = Date.now();
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const fullPath = path.join(ENV.PHOTO_UPLOAD_DIR, file);
      const stat = await fs.promises.stat(fullPath);
      if (now - stat.mtimeMs > maxAgeMs) {
        await fs.promises.unlink(fullPath);
        deletedCount++;
      }
    }
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed during expired photo cleanup');
  }
  return deletedCount;
}
