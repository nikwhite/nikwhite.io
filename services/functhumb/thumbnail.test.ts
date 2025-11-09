import { describe, it, expect, beforeAll } from 'vitest';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import {
  generateThumbnail,
  getThumbnailPath,
  shouldProcessFile,
  isSupportedImageFormat,
  DEFAULT_CONFIG
} from './thumbnail.js';

/**
 * Test suite for thumbnail generation
 *
 * These tests use REAL Sharp operations on actual image buffers.
 * No mocking of Sharp - we want to test the actual image processing.
 */

describe('Thumbnail Generation', () => {
  let testImageBuffer: Buffer;
  let wideImageBuffer: Buffer;
  let tallImageBuffer: Buffer;

  beforeAll(async () => {
    // Create test images programmatically using Sharp
    // This way we don't need to commit binary image files to the repo

    // Create a standard test image (800x600)
    testImageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 100, g: 150, b: 200 }
      }
    })
    .jpeg()
    .toBuffer();

    // Create a wide image (1600x400)
    wideImageBuffer = await sharp({
      create: {
        width: 1600,
        height: 400,
        channels: 3,
        background: { r: 200, g: 100, b: 150 }
      }
    })
    .jpeg()
    .toBuffer();

    // Create a tall image (400x1600)
    tallImageBuffer = await sharp({
      create: {
        width: 400,
        height: 1600,
        channels: 3,
        background: { r: 150, g: 200, b: 100 }
      }
    })
    .jpeg()
    .toBuffer();
  });

  describe('generateThumbnail', () => {
    it('should generate a square thumbnail with correct dimensions', async () => {
      const result = await generateThumbnail(testImageBuffer);

      // Verify output dimensions using Sharp metadata
      const metadata = await sharp(result.buffer).metadata();
      expect(metadata.width).toBe(400);
      expect(metadata.height).toBe(400);
      expect(result.size).toBe(400);
    });

    it('should preserve original image metadata', async () => {
      const result = await generateThumbnail(testImageBuffer);

      // Verify original metadata was captured
      expect(result.originalMetadata.width).toBe(800);
      expect(result.originalMetadata.height).toBe(600);
      expect(result.originalMetadata.format).toBe('jpeg');
    });

    it('should output JPEG format by default', async () => {
      const result = await generateThumbnail(testImageBuffer);

      const metadata = await sharp(result.buffer).metadata();
      expect(metadata.format).toBe('webp');
      expect(result.format).toBe('webp');
    });

    it('should support WebP output format', async () => {
      const result = await generateThumbnail(testImageBuffer, {
        size: 400,
        quality: 85,
        format: 'webp'
      });

      const metadata = await sharp(result.buffer).metadata();
      expect(metadata.format).toBe('webp');
      expect(result.format).toBe('webp');
    });

    it('should handle custom thumbnail sizes', async () => {
      const result = await generateThumbnail(testImageBuffer, {
        size: 200,
        quality: 85,
        format: 'webp'
      });

      const metadata = await sharp(result.buffer).metadata();
      expect(metadata.width).toBe(200);
      expect(metadata.height).toBe(200);
      expect(result.size).toBe(200);
    });

    it('should crop wide images to square', async () => {
      const result = await generateThumbnail(wideImageBuffer);

      // Wide image (1600x400) should be cropped to 400x400
      const metadata = await sharp(result.buffer).metadata();
      expect(metadata.width).toBe(400);
      expect(metadata.height).toBe(400);

      // Original dimensions should be preserved in metadata
      expect(result.originalMetadata.width).toBe(1600);
      expect(result.originalMetadata.height).toBe(400);
    });

    it('should crop tall images to square', async () => {
      const result = await generateThumbnail(tallImageBuffer);

      // Tall image (400x1600) should be cropped to 400x400
      const metadata = await sharp(result.buffer).metadata();
      expect(metadata.width).toBe(400);
      expect(metadata.height).toBe(400);

      // Original dimensions should be preserved in metadata
      expect(result.originalMetadata.width).toBe(400);
      expect(result.originalMetadata.height).toBe(1600);
    });

    it('should produce valid image data that can be re-read', async () => {
      const result = await generateThumbnail(testImageBuffer);

      // Should be able to load the output buffer with Sharp without errors
      const reloaded = sharp(result.buffer);
      const metadata = await reloaded.metadata();

      expect(metadata.width).toBe(400);
      expect(metadata.height).toBe(400);
      expect(metadata.format).toBe('webp');
    });

    it('should apply quality settings', async () => {
      // Generate with low quality
      const lowQuality = await generateThumbnail(testImageBuffer, {
        size: 400,
        quality: 50,
        format: 'webp'
      });

      // Generate with high quality
      const highQuality = await generateThumbnail(testImageBuffer, {
        size: 400,
        quality: 95,
        format: 'webp'
      });

      // High quality should produce larger file
      expect(highQuality.buffer.length).toBeGreaterThan(lowQuality.buffer.length);
    });
  });

  describe('Path utilities', () => {
    it('should transform original/ paths to thumb_400/ paths', () => {
      const input = 'original/photos/2024/vacation.webp';
      const output = getThumbnailPath(input);
      expect(output).toBe('thumb_400/photos/2024/vacation.webp');
    });

    it('should support custom thumbnail sizes in path', () => {
      const input = 'original/photos/2024/vacation.webp';
      const output = getThumbnailPath(input, 800);
      expect(output).toBe('thumb_800/photos/2024/vacation.webp');
    });

    it('should throw error for paths not starting with original/', () => {
      expect(() => getThumbnailPath('photos/vacation.webp')).toThrow();
      expect(() => getThumbnailPath('thumb_400/photos/vacation.webp')).toThrow();
    });

    it('should handle nested paths correctly', () => {
      const input = 'original/a/b/c/d/file.png';
      const output = getThumbnailPath(input);
      expect(output).toBe('thumb_400/a/b/c/d/file.png');
    });
  });

  describe('File processing validation', () => {
    it('should only process files in original/ prefix', () => {
      expect(shouldProcessFile('original/photo.webp')).toBe(true);
      expect(shouldProcessFile('original/nested/path/photo.webp')).toBe(true);
      expect(shouldProcessFile('thumb_400/photo.webp')).toBe(false);
      expect(shouldProcessFile('photos/photo.webp')).toBe(false);
      expect(shouldProcessFile('other/photo.webp')).toBe(false);
    });

    it('should identify supported image formats', () => {
      // Supported formats
      expect(isSupportedImageFormat('image/jpeg')).toBe(true);
      expect(isSupportedImageFormat('image/jpg')).toBe(true);
      expect(isSupportedImageFormat('image/png')).toBe(true);
      expect(isSupportedImageFormat('image/webp')).toBe(true);
      expect(isSupportedImageFormat('image/gif')).toBe(true);
      expect(isSupportedImageFormat('image/tiff')).toBe(true);
      expect(isSupportedImageFormat('image/heic')).toBe(true);

      // Case insensitive
      expect(isSupportedImageFormat('IMAGE/JPEG')).toBe(true);
      expect(isSupportedImageFormat('Image/Png')).toBe(true);

      // Unsupported formats
      expect(isSupportedImageFormat('application/pdf')).toBe(false);
      expect(isSupportedImageFormat('video/mp4')).toBe(false);
      expect(isSupportedImageFormat('text/plain')).toBe(false);
      expect(isSupportedImageFormat(undefined)).toBe(false);
    });
  });

  describe('Integration: Save output for visual inspection', () => {
    it('should save test thumbnails to output directory', async () => {
      // Create output directory
      const outputDir = join(process.cwd(), 'test-output');
      await mkdir(outputDir, { recursive: true });

      // Generate and save standard thumbnail
      const standardResult = await generateThumbnail(testImageBuffer);
      await writeFile(
        join(outputDir, 'standard-thumb.webp'),
        standardResult.buffer
      );

      // Generate and save wide image thumbnail
      const wideResult = await generateThumbnail(wideImageBuffer);
      await writeFile(
        join(outputDir, 'wide-thumb.webp'),
        wideResult.buffer
      );

      // Generate and save tall image thumbnail
      const tallResult = await generateThumbnail(tallImageBuffer);
      await writeFile(
        join(outputDir, 'tall-thumb.webp'),
        tallResult.buffer
      );

      // Generate and save WebP thumbnail
      const webpResult = await generateThumbnail(testImageBuffer, {
        size: 400,
        quality: 85,
        format: 'webp'
      });
      await writeFile(
        join(outputDir, 'standard-thumb.webp'),
        webpResult.buffer
      );

      // Verify all files were created and are valid
      const standardMeta = await sharp(standardResult.buffer).metadata();
      expect(standardMeta.width).toBe(400);
      expect(standardMeta.height).toBe(400);

      console.log('✅ Test thumbnails saved to test-output/ directory');
      console.log('   - standard-thumb.webp (from 800x600)');
      console.log('   - wide-thumb.webp (from 1600x400)');
      console.log('   - tall-thumb.webp (from 400x1600)');
      console.log('   - standard-thumb.webp (WebP format)');
    });
  });
});
