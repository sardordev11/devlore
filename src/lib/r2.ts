import "server-only";

import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

let client: S3Client | undefined;

function getClient(): S3Client {
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
  return client;
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME is not set");
  return bucket;
}

function getPublicBaseUrl(): string {
  const url = process.env.R2_PUBLIC_URL;
  if (!url) throw new Error("R2_PUBLIC_URL is not set");
  return url.replace(/\/+$/, "");
}

// Every object lives under its owner's prefix, so ownership can be checked from the key alone.
export function createFileKey(userId: string, extension: string): string {
  return `users/${userId}/${randomUUID()}${extension}`;
}

export function isOwnedFileKey(userId: string, key: string): boolean {
  const prefix = `users/${userId}/`;
  const name = key.slice(prefix.length);
  return key.startsWith(prefix) && /^[\w-]+\.[a-z]+$/.test(name);
}

// Item.fileUrl stores the public URL of the object.
export function getFileUrl(key: string): string {
  return `${getPublicBaseUrl()}/${key}`;
}

// Returns null for URLs that don't point into the bucket.
export function getFileKey(fileUrl: string): string | null {
  const prefix = `${getPublicBaseUrl()}/`;
  return fileUrl.startsWith(prefix) ? fileUrl.slice(prefix.length) : null;
}

export async function uploadFile(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: body.byteLength,
    }),
  );
}

// Returns null when the object doesn't exist.
export async function getFileStream(
  key: string,
): Promise<ReadableStream | null> {
  try {
    const object = await getClient().send(
      new GetObjectCommand({ Bucket: getBucket(), Key: key }),
    );
    return object.Body?.transformToWebStream() ?? null;
  } catch (error) {
    if (error instanceof NoSuchKey) return null;
    throw error;
  }
}

export async function deleteFile(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key }),
  );
}
