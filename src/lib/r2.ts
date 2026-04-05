import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

/**
 * Upload image buffer to R2.
 * Returns only the object key (path) — never the full URL.
 * Use getPublicUrl(key) on the frontend to reconstruct the full URL.
 */
export async function uploadImage(buffer: Buffer, key: string): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/jpeg',
  }));
  return key; // e.g. "plates/1234-uuid.jpg"
}

/**
 * Presigned GET URL — valid for 5 minutes.
 * Used server-side only: passed to Modal so it can download the image for OCR.
 * Not stored anywhere; not exposed to the frontend.
 */
export async function getPresignedUrl(key: string): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 300 },
  );
}

/**
 * Build the public CDN URL from a stored key.
 * Call this on the frontend (or server) wherever you need to display the image.
 * NEXT_PUBLIC_R2_URL = https://pub-06159dbc623e4108ab7d904ea419ef6f.r2.dev
 *
 * Usage (frontend):
 *   import { getPublicUrl } from '@/lib/r2'
 *   <img src={getPublicUrl(plate.image_key)} />
 */
export function getPublicUrl(key: string): string {
  const base = process.env.NEXT_PUBLIC_R2_URL ?? '';
  return `${base}/${key}`;
}
