import { NextRequest } from "next/server"

// Miner app installers are published as GitHub release assets on marscredit/monorepo.
// Asset names carry no version, so "latest" always serves the newest release.
const RELEASE_BASE = "https://github.com/marscredit/monorepo/releases/latest/download"

const ASSETS: Record<string, string> = {
  "mac-arm64": "Mars-Credit-Miner-mac-arm64.dmg",
  "mac-x64": "Mars-Credit-Miner-mac-x64.dmg",
  "win": "Mars-Credit-Miner-win-x64-setup.exe",
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params
  const asset = ASSETS[platform]

  if (!asset) {
    return new Response("Invalid platform. Use: mac-arm64, mac-x64, win", {
      status: 400,
    })
  }

  return Response.redirect(`${RELEASE_BASE}/${asset}`, 302)
}
