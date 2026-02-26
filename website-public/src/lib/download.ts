export interface DownloadOption {
  url: string;
  label: string;
  platform: string;
}

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
];

export function getMinerDownloadUrl(): DownloadOption {
  if (typeof navigator === "undefined") return DOWNLOADS[0];

  const ua = navigator.userAgent;
  const platform = navigator.platform;

  if (/Win/.test(platform)) {
    return DOWNLOADS[2];
  }

  if (/Mac/.test(platform) || /Macintosh/.test(ua)) {
    // Chromium exposes architecture via userAgentData
    const uaData = (navigator as Navigator & { userAgentData?: { architecture?: string } }).userAgentData;
    if (uaData?.architecture === "arm") {
      return DOWNLOADS[0];
    }
    // Older Safari/Firefox on Apple Silicon still report "MacIntel" in platform,
    // but we can't reliably distinguish. Default to Apple Silicon since most Macs
    // sold since late 2020 are ARM-based.
    return DOWNLOADS[0];
  }

  return DOWNLOADS[0];
}
