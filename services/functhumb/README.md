# `functhumb`

> It's a cloud function for generating thumbnails. get it? whatever, it's dumb.

Generates 400×400 square thumbnails with face-aware cropping when images are uploaded to `original/` prefix.

## Path Transformation

```
original/photos/2024/vacation.jpg  →  thumb_400/photos/2024/vacation.jpg
```

## Development

```bash
npm install
npm test
```

## Deploy

Deploy to Google Cloud Functions (2nd gen):

```bash
gcloud functions deploy generateThumbnail \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=generateThumbnailFunction \
  --trigger-event-filters="type=google.cloud.storage.object.v1.finalized" \
  --trigger-event-filters="bucket=YOUR_BUCKET_NAME"
```

## Metadata

Custom metadata attached to thumbnails for sorting/filtering (e.g.):

```typescript
{
  originalPath: 'original/photos/vacation.jpg',
  originalWidth: '1920',
  originalHeight: '1080',
  thumbnailWidth: '400',
  thumbnailHeight: '400',
  strategy: 'attention',
  processedAt: '2024-11-09T17:00:00.000Z'
}
```

## Supported Formats

JPEG, PNG, WebP, TIFF, GIF, SVG, HEIC/HEIF


