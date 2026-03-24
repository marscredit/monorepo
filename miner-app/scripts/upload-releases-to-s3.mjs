#!/usr/bin/env node
/**
 * Upload miner-app release artifacts to S3 for the public download API.
 *
 * Required env vars:
 *   S3_ENDPOINT          – e.g. https://<accountid>.r2.cloudflarestorage.com
 *   S3_BUCKET            – bucket name
 *   S3_ACCESS_KEY_ID     – access key
 *   S3_SECRET_ACCESS_KEY – secret key
 *   S3_REGION            – (optional, defaults to "auto")
 *
 * Usage:
 *   S3_ENDPOINT=... S3_BUCKET=... S3_ACCESS_KEY_ID=... S3_SECRET_ACCESS_KEY=... \
 *     node scripts/upload-releases-to-s3.mjs
 */

import { createRequire } from "module";
import { readFileSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve @aws-sdk from website-public/node_modules since miner-app doesn't depend on it
const require = createRequire(resolve(__dirname, "..", "..", "website-public", "package.json"));
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const releaseDir = resolve(__dirname, "..", "release");

const REQUIRED_VARS = ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"];
for (const v of REQUIRED_VARS) {
  if (!process.env[v]) {
    console.error(`Missing required env var: ${v}`);
    process.exit(1);
  }
}

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? "auto",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

const ARTIFACTS = [
  {
    file: "Mars Credit Miner-1.0.0-arm64.dmg",
    key: "releases/v1.0.0/Mars Credit Miner-1.0.0-arm64.dmg",
    contentType: "application/x-apple-diskimage",
  },
  {
    file: "Mars Credit Miner-1.0.0.dmg",
    key: "releases/v1.0.0/Mars Credit Miner-1.0.0.dmg",
    contentType: "application/x-apple-diskimage",
  },
  {
    file: "Mars Credit Miner Setup 1.0.0.exe",
    key: "releases/v1.0.0/Mars Credit Miner Setup 1.0.0.exe",
    contentType: "application/vnd.microsoft.portable-executable",
  },
];

async function upload(artifact) {
  const filePath = resolve(releaseDir, artifact.file);
  try {
    statSync(filePath);
  } catch {
    console.warn(`  SKIP: ${artifact.file} not found at ${filePath}`);
    return;
  }

  const body = readFileSync(filePath);
  const sizeMB = (body.length / (1024 * 1024)).toFixed(1);
  console.log(`  Uploading ${artifact.file} (${sizeMB} MB) -> ${artifact.key}`);

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: artifact.key,
      Body: body,
      ContentType: artifact.contentType,
    })
  );
  console.log(`  Done: ${artifact.key}`);
}

console.log("Uploading release artifacts to S3...\n");
for (const a of ARTIFACTS) {
  await upload(a);
}
console.log("\nAll uploads complete.");
