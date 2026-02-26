import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { NextRequest } from "next/server"

const OBJECT_KEYS: Record<string, string> = {
  "mac-arm64": "releases/v1.0.0/Mars Credit Miner-1.0.0-arm64.dmg",
  "mac-x64": "releases/v1.0.0/Mars Credit Miner-1.0.0.dmg",
  "win": "releases/v1.0.0/Mars Credit Miner Setup 1.0.0.exe",
}

function getS3Client() {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT!,
    region: process.env.S3_REGION ?? "auto",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: false,
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params
  const key = OBJECT_KEYS[platform]

  if (!key) {
    return new Response("Invalid platform. Use: mac-arm64, mac-x64, win", {
      status: 400,
    })
  }

  try {
    const url = await getSignedUrl(
      getS3Client(),
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
      }),
      { expiresIn: 3600 },
    )

    return Response.redirect(url, 302)
  } catch (e) {
    console.error("Failed to generate presigned URL:", e)
    return new Response("Download temporarily unavailable", { status: 502 })
  }
}
