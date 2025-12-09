// lib/cloudflare.js
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadArtifact(buffer, fileName) {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: fileName, // e.g., "artifacts/123e4567-e89b-12d3-a456-426614174000.png"
      Body: buffer,
      ContentType: 'image/png',
      ACL: 'public-read', // Make publicly accessible
    });

    const result = await r2Client.send(command);

    // Construct public URL
    const publicUrl = `https://${process.env.CLOUDFLARE_R2_BUCKET_NAME}.${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${fileName}`;

    return {
      success: true,
      url: publicUrl,
      key: fileName,
      size: buffer.length,
    };
  } catch (error) {
    console.error('R2 upload failed:', error);
    throw new Error(`Failed to upload to R2: ${error.message}`);
  }
}

export async function deleteArtifact(fileName) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: fileName,
    });

    await r2Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('R2 delete failed:', error);
    throw new Error(`Failed to delete from R2: ${error.message}`);
  }
}
