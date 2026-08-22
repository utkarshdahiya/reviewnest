import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

// Accepts a base64 data URL (e.g. "data:image/png;base64,iVBORw0KG...")
// Uploads it to R2, and returns the public URL to store in the database.
export async function uploadBase64ToR2(base64DataUrl, keyPrefix) {
  if (!base64DataUrl) return null;

  const match = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    // Not a base64 data URL (might already be a plain URL) — just return as-is
    return base64DataUrl;
  }

  const contentType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");

  const extension = contentType.split("/")[1] || "bin";
  const key = `${keyPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}