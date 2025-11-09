import { Storage } from '@google-cloud/storage';
import type { ImageMetadata } from './thumbnail.js';

/**
 * Cloud Storage file information from CloudEvent
 */
export interface StorageFileData {
  bucket: string;
  name: string;
  contentType?: string;
  size?: number;
  timeCreated?: string;
  updated?: string;
  metageneration?: string;
}

/**
 * Download a file from Cloud Storage
 *
 * @param bucketName - Name of the Cloud Storage bucket
 * @param filePath - Path to the file within the bucket
 * @returns The file contents as a Buffer
 */
export async function downloadFile(
  bucketName: string,
  filePath: string
): Promise<Buffer> {
  const storage = new Storage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  const [buffer] = await file.download();
  return buffer;
}

/**
 * Upload a file to Cloud Storage with metadata
 *
 * @param bucketName - Name of the Cloud Storage bucket
 * @param filePath - Destination path within the bucket
 * @param buffer - File contents to upload
 * @param contentType - MIME type of the file
 * @param customMetadata - Custom metadata to attach to the file
 */
export async function uploadFile(
  bucketName: string,
  filePath: string,
  buffer: Buffer,
  contentType: string,
  customMetadata?: Record<string, string>
): Promise<void> {
  const storage = new Storage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  await file.save(buffer, {
    contentType,
    metadata: customMetadata ? { metadata: customMetadata } : undefined,
    // Ensure the file is publicly readable if your bucket is configured that way
    // Remove this if you want private files
    predefinedAcl: 'publicRead'
  });
}

/**
 * Create metadata object for thumbnail file in Cloud Storage
 *
 * This metadata will be stored with the thumbnail file and can be used
 * for sorting, filtering, and querying on the frontend.
 *
 * @param originalMetadata - Metadata from the original image
 * @param thumbnailSize - Size of the generated thumbnail
 * @param originalPath - Path to the original image
 * @returns Custom metadata object for Cloud Storage
 */
export function createThumbnailMetadata(
  originalMetadata: ImageMetadata,
  thumbnailSize: number,
  originalPath: string
): Record<string, string> {
  return {
    originalPath,
    originalWidth: String(originalMetadata.width),
    originalHeight: String(originalMetadata.height),
    originalFormat: originalMetadata.format || 'unknown',
    thumbnailWidth: String(thumbnailSize),
    thumbnailHeight: String(thumbnailSize),
    thumbnailSize: String(thumbnailSize),
    strategy: 'attention',
    processedAt: new Date().toISOString(),
    processor: 'sharp',
    cropMethod: 'face-aware'
  };
}
