import type { MetadataRoute } from "next"
import { site } from "@/lib/config"

const baseUrl = site.url

const staticPaths = [
  "",
  "/start-mining",
  "/story",
  "/tokenomics",
  "/updates",
  "/updates/solana-bridge-paused",
  "/updates/macos-mining-app-released",
]

export default function sitemap(): MetadataRoute.Sitemap {
  return staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: (path === "" || path === "/start-mining" || path === "/story" || path === "/updates" ? "weekly" : "monthly") as "weekly" | "monthly",
    priority: path === "" ? 1 : path === "/start-mining" ? 0.95 : path === "/story" ? 0.9 : path === "/updates" ? 0.8 : 0.7,
  }))
}
