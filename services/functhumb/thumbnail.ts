import sharp from 'sharp';

/**
 * Configuration for thumbnail generation
 */
export interface ThumbnailConfig {
  /** Size of the square thumbnail (width and height) */
  size: number;
  /** JPEG quality (1-100) */
  quality: number;
  /** Output format */
  format: 'webp';
}

/**
 * Metadata extracted from the original image
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format?: string;
  space?: string;
  channels?: number;
  hasAlpha?: boolean;
  orientation?: number;
  exif?: Buffer;
}

/**
 * Result of thumbnail generation
 */
export interface ThumbnailResult {
  /** The processed thumbnail as a Buffer */
  buffer: Buffer;
  /** Metadata from the original image */
  originalMetadata: ImageMetadata;
  /** Output format used */
  format: string;
  /** Size of the thumbnail */
  size: number;
}

/**
 * Default thumbnail configuration
 */
export const DEFAULT_CONFIG: ThumbnailConfig = {
  size: 400,
  quality: 85,
  format: 'webp'
};

/**
 * Generate a square thumbnail from an image buffer using face-aware cropping.
 *
 * This function uses Sharp's 'attention' strategy which focuses on:
 * - Regions with high luminance frequency
 * - Areas with high colour saturation
 * - Presence of skin tones (face detection)
 *
 * The function is pure and testable - it only depends on the input buffer
 * and configuration, with no external dependencies or side effects.
 *
 * @param inputBuffer - The original image as a Buffer
 * @param config - Thumbnail configuration (size, quality, format)
 * @returns Promise resolving to the thumbnail buffer and metadata
 *
 * @example
 * ```typescript
 * const input = await fs.readFile('photo.jpg');
 * const result = await generateThumbnail(input, { size: 400, quality: 85, format: 'jpeg' });
 * await fs.writeFile('thumb.jpg', result.buffer);
 * ```
 */
export async function generateThumbnail(
  inputBuffer: Buffer,
  config: ThumbnailConfig = DEFAULT_CONFIG
): Promise<ThumbnailResult> {
  // First, get metadata from the original image
  const sharpInstance = sharp(inputBuffer);
  const metadata = await sharpInstance.metadata();

  // Store original metadata for preservation
  const originalMetadata: ImageMetadata = {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format,
    space: metadata.space,
    channels: metadata.channels,
    hasAlpha: metadata.hasAlpha,
    orientation: metadata.orientation,
    exif: metadata.exif
  };

  // Generate thumbnail with face-aware cropping
  const thumbnailBuffer = await sharp(inputBuffer)
    .resize(config.size, config.size, {
      fit: 'cover',                           // Fill the entire target dimensions
      position: sharp.strategy.attention      // Focus on faces/skin tones/high saturation areas
    })
    .withMetadata({                           // Preserve metadata
      orientation: metadata.orientation,
      // Note: EXIF data is automatically copied when withMetadata() is called
    })
    [config.format]({                         // Output format
      quality: config.quality,
    })
    .toBuffer();

  return {
    buffer: thumbnailBuffer,
    originalMetadata,
    format: config.format,
    size: config.size
  };
}

/**
 * Extract the thumbnail path from an original path.
 *
 * Transforms: original/path/to/file.jpg -> thumb_400/path/to/file.jpg
 *
 * @param originalPath - The original file path (must start with 'original/')
 * @param size - Thumbnail size (default: 400)
 * @returns The thumbnail path
 * @throws Error if path doesn't start with 'original/'
 */
export function getThumbnailPath(originalPath: string, size: number = 400): string {
  if (!originalPath.startsWith('original/')) {
    throw new Error(`Path must start with 'original/', got: ${originalPath}`);
  }

  return originalPath.replace(/^original\//, `thumb_${size}/`);
}

/**
 * Check if a path is eligible for thumbnail generation.
 * Only files in the 'original/' prefix should be processed.
 *
 * @param path - The file path to check
 * @returns true if the file should be processed
 */
export function shouldProcessFile(path: string): boolean {
  return path.startsWith('original/');
}

/**
 * Check if a file is a supported image format based on content type.
 *
 * @param contentType - The MIME type of the file
 * @returns true if the file is a supported image format
 */
export function isSupportedImageFormat(contentType: string | undefined): boolean {
  if (!contentType) return false;

  const supportedFormats = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/tiff',
    'image/gif',
    'image/svg+xml',
    'image/heic',
    'image/heif'
  ];

  return supportedFormats.includes(contentType.toLowerCase());
}
