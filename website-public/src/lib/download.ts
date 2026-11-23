export interface DownloadOption {
  url: string
  label: string
  platform: string
}

export const START_MINING_HREF = "/start-mining"
export const LINUX_MINING_HREF = "/start-mining#linux"

export const DOWNLOADS: DownloadOption[] = [
  {
    url: "/api/download/mac-arm64",
    label: "macOS (Apple Silicon)",
    platform: "mac-arm64",
  },
  {
    url: "/api/download/mac-x64",
    label: "macOS (Intel)",
    platform: "mac-x64",
  },
  {
    url: "/api/download/win",
    label: "Windows",
    platform: "win",
  },
]

export const LINUX_DOWNLOAD: DownloadOption = {
  url: LINUX_MINING_HREF,
  label: "Linux (CLI node)",
  platform: "linux",
}

export type OsFamily = "mac" | "win" | "linux" | "ios" | "android" | "other"

export type MinerCta =
  | {
      kind: "download"
      href: string
      label: string
      platform: "mac-arm64" | "mac-x64" | "win"
    }
  | {
      kind: "guide"
      href: string
      label: string
      platform: "linux" | "ios" | "android" | "other"
    }

export type NavigatorLike = {
  userAgent?: string
  platform?: string
  userAgentData?: {
    architecture?: string
    platform?: string
    mobile?: boolean
  }
}

function haystack(nav: NavigatorLike): { ua: string; platform: string; uaPlatform: string } {
  const ua = nav.userAgent ?? ""
  const platform = nav.platform ?? ""
  const uaPlatform = nav.userAgentData?.platform ?? ""
  return { ua, platform, uaPlatform }
}

export function detectOsFamily(nav: NavigatorLike): OsFamily {
  const { ua, platform, uaPlatform } = haystack(nav)
  const blob = `${ua} ${platform} ${uaPlatform}`

  // Check mobile OS first: Android UA also contains "Linux".
  if (/Android/i.test(blob)) return "android"
  if (/iPhone|iPad|iPod/i.test(blob)) return "ios"

  if (/Win/i.test(platform) || /Windows/i.test(ua) || /Windows/i.test(uaPlatform)) {
    return "win"
  }

  if (/Mac/i.test(platform) || /Macintosh|Mac OS X/i.test(ua) || /macOS/i.test(uaPlatform)) {
    return "mac"
  }

  if (
    /Linux/i.test(platform) ||
    /Linux/i.test(ua) ||
    /Linux/i.test(uaPlatform) ||
    /X11/i.test(platform) ||
    /CrOS/i.test(ua)
  ) {
    return "linux"
  }

  return "other"
}

function macDownload(nav: NavigatorLike): MinerCta {
  const arch = nav.userAgentData?.architecture?.toLowerCase()
  const { ua } = haystack(nav)
  if (arch === "x86" || arch === "x86_64" || (/Intel/i.test(ua) && /x86_64/i.test(ua))) {
    return {
      kind: "download",
      href: DOWNLOADS[1].url,
      label: `Download for ${DOWNLOADS[1].label}`,
      platform: "mac-x64",
    }
  }
  // Chromium exposes architecture via userAgentData; Safari still reports MacIntel
  // on Apple Silicon. Default to arm64 — that is what most Macs sold since 2020 are.
  if (arch === "arm" || arch === "arm64" || /ARM|Apple Silicon/i.test(ua)) {
    return {
      kind: "download",
      href: DOWNLOADS[0].url,
      label: `Download for ${DOWNLOADS[0].label}`,
      platform: "mac-arm64",
    }
  }
  return {
    kind: "download",
    href: DOWNLOADS[0].url,
    label: `Download for ${DOWNLOADS[0].label}`,
    platform: "mac-arm64",
  }
}

export function getMinerCta(nav: NavigatorLike): MinerCta {
  const os = detectOsFamily(nav)
  switch (os) {
    case "win":
      return {
        kind: "download",
        href: DOWNLOADS[2].url,
        label: `Download for ${DOWNLOADS[2].label}`,
        platform: "win",
      }
    case "mac":
      return macDownload(nav)
    case "linux":
      return {
        kind: "guide",
        href: LINUX_MINING_HREF,
        label: "Start mining on Linux",
        platform: "linux",
      }
    case "android":
      return {
        kind: "guide",
        href: START_MINING_HREF,
        label: "How to start mining",
        platform: "android",
      }
    case "ios":
      return {
        kind: "guide",
        href: START_MINING_HREF,
        label: "How to start mining",
        platform: "ios",
      }
    default:
      // Unknown OS must never receive the Mac DMG (the previous default).
      return {
        kind: "guide",
        href: START_MINING_HREF,
        label: "Start mining",
        platform: "other",
      }
  }
}

/** Hero/CTA helper. Safe to call from useEffect; returns a Linux guide, not a DMG, on Linux. */
export function getMinerDownloadUrl(nav?: NavigatorLike): DownloadOption {
  if (!nav && typeof navigator === "undefined") {
    return { url: START_MINING_HREF, label: "Start mining", platform: "other" }
  }
  const cta = getMinerCta(nav ?? navigator)
  return { url: cta.href, label: cta.label.replace(/^Download for /, ""), platform: cta.platform }
}
