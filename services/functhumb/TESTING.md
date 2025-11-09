# Testing with Real Photos

If you want to test the face-aware cropping with actual photos containing faces, here's how:

## Quick Test

1. **Add a photo to test with:**
   ```bash
   # Download a sample photo with a face (or use your own)
   curl -o test-photo.jpg "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800"
   ```

2. **Create a simple test script:**
   ```typescript
   // test-real-photo.ts
   import { readFile, writeFile } from 'fs/promises';
   import { generateThumbnail } from './thumbnail.js';

   async function testRealPhoto() {
     console.log('Loading photo...');
     const photo = await readFile('test-photo.jpg');

     console.log('Generating thumbnail with face detection...');
     const result = await generateThumbnail(photo);

     console.log('Saving thumbnail...');
     await writeFile('test-photo-thumb.jpg', result.buffer);

     console.log('✅ Done! Check test-photo-thumb.jpg');
     console.log(`Original: ${result.originalMetadata.width}x${result.originalMetadata.height}`);
     console.log(`Thumbnail: ${result.size}x${result.size}`);
   }

   testRealPhoto();
   ```

3. **Run it:**
   ```bash
   npx tsx test-real-photo.ts
   ```

## Visual Comparison Test

To verify the attention strategy is working:

```bash
# Generate thumbnails with different strategies for comparison

# Face-aware (attention strategy) - default
npx tsx -e "
  import { readFile, writeFile } from 'fs/promises';
  import sharp from 'sharp';
  const img = await readFile('photo.jpg');
  const thumb = await sharp(img).resize(400, 400, {
    fit: 'cover',
    position: sharp.strategy.attention
  }).toFile('thumb-attention.jpg');
"

# Center crop (no face detection)
npx tsx -e "
  import { readFile } from 'fs/promises';
  import sharp from 'sharp';
  const img = await readFile('photo.jpg');
  await sharp(img).resize(400, 400, {
    fit: 'cover',
    position: 'center'
  }).toFile('thumb-center.jpg');
"

# Compare the two - attention should center on faces!
```

## Expected Behavior

- **Portrait with face:** Thumbnail should center on the face
- **Group photo:** Should focus on the most prominent faces/people
- **Landscape:** Should focus on the most colorful/detailed area
- **Wide image:** Should intelligently crop to the most interesting region

The `attention` strategy uses:
- ✅ Face/skin tone detection
- ✅ High color saturation detection
- ✅ High luminance frequency (edges, details)
