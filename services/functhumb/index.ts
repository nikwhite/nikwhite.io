import { cloudEvent } from '@google-cloud/functions-framework';
import type { CloudEvent } from '@google-cloud/functions-framework';
import {
  generateThumbnail as createThumbnail,
  getThumbnailPath,
  shouldProcessFile,
  isSupportedImageFormat,
  DEFAULT_CONFIG
} from './thumbnail.js';
import {
  downloadFile,
  uploadFile,
  createThumbnailMetadata,
  type StorageFileData
} from './storage.js';

/**
 * Cloud Function that generates thumbnails when images are uploaded to Cloud Storage.
 *
 * Triggered by: Cloud Storage object finalization events
 * Input: Files in the 'original/' path prefix
 * Output: Square thumbnails in 'thumb_400/' path prefix with face-aware cropping
 *
 * The function:
 * 1. Validates the file is in 'original/' and is a supported image format
 * 2. Downloads the original image from Cloud Storage
 * 3. Generates a square thumbnail using Sharp with attention strategy (face detection)
 * 4. Uploads the thumbnail to 'thumb_400/' with preserved metadata
 * 5. Logs success/failure with structured logging for Cloud Logging
 */
export const generateThumbnailFunction = cloudEvent(
  'generateThumbnail',
  async (cloudEvent: CloudEvent<StorageFileData>) => {
    const file = cloudEvent.data;

    // Validate event data
    if (!file) {
      console.log(JSON.stringify({
        severity: 'WARNING',
        message: 'No file data received',
        eventId: cloudEvent.id,
        eventType: cloudEvent.type
      }));
      return;
    }

    // Log incoming event
    console.log(JSON.stringify({
      severity: 'INFO',
      message: 'Processing storage event',
      event: {
        id: cloudEvent.id,
        type: cloudEvent.type,
        source: cloudEvent.source,
        subject: cloudEvent.subject
      },
      file: {
        bucket: file.bucket,
        name: file.name,
        contentType: file.contentType,
        size: file.size
      }
    }));

    // Skip files not in 'original/' prefix to prevent infinite loops
    if (!shouldProcessFile(file.name)) {
      console.log(JSON.stringify({
        severity: 'INFO',
        message: 'Skipping file - not in original/ prefix',
        file: { name: file.name }
      }));
      return;
    }

    // Skip unsupported file formats
    if (!isSupportedImageFormat(file.contentType)) {
      console.log(JSON.stringify({
        severity: 'INFO',
        message: 'Skipping file - unsupported format',
        file: { name: file.name, contentType: file.contentType }
      }));
      return;
    }

    try {
      // Download the original image
      console.log(JSON.stringify({
        severity: 'INFO',
        message: 'Downloading original image',
        file: { bucket: file.bucket, name: file.name }
      }));

      const imageBuffer = await downloadFile(file.bucket, file.name);

      // Generate thumbnail
      console.log(JSON.stringify({
        severity: 'INFO',
        message: 'Generating thumbnail',
        config: DEFAULT_CONFIG
      }));

      const result = await createThumbnail(imageBuffer, DEFAULT_CONFIG);

      // Determine output path
      const thumbnailPath = getThumbnailPath(file.name, DEFAULT_CONFIG.size);

      // Create metadata for the thumbnail
      const metadata = createThumbnailMetadata(
        result.originalMetadata,
        result.size,
        file.name
      );

      // Upload thumbnail to Cloud Storage
      console.log(JSON.stringify({
        severity: 'INFO',
        message: 'Uploading thumbnail',
        file: { bucket: file.bucket, path: thumbnailPath }
      }));

      await uploadFile(
        file.bucket,
        thumbnailPath,
        result.buffer,
        `image/${result.format}`,
        metadata
      );

      // Log success
      console.log(JSON.stringify({
        severity: 'INFO',
        message: 'Thumbnail generated successfully',
        original: {
          path: file.name,
          width: result.originalMetadata.width,
          height: result.originalMetadata.height,
          size: file.size
        },
        thumbnail: {
          path: thumbnailPath,
          width: result.size,
          height: result.size,
          format: result.format
        }
      }));

    } catch (error) {
      // Log error with full context
      console.log(JSON.stringify({
        severity: 'ERROR',
        message: 'Failed to generate thumbnail',
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        },
        file: {
          bucket: file.bucket,
          name: file.name,
          contentType: file.contentType
        }
      }));

      // Re-throw to mark the Cloud Function execution as failed
      throw error;
    }
  }
);
