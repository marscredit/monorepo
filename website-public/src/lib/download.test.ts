import { describe, expect, it } from "vitest"
import { detectOsFamily, getMinerCta, getMinerDownloadUrl, LINUX_MINING_HREF, START_MINING_HREF } from "./download"

describe("detectOsFamily", () => {
  it("detects Windows", () => {
    expect(detectOsFamily({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", platform: "Win32" })).toBe("win")
  })

  it("detects macOS", () => {
    expect(detectOsFamily({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", platform: "MacIntel" })).toBe("mac")
  })

  it("detects Linux (does not treat it as Mac)", () => {
    expect(detectOsFamily({ userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36", platform: "Linux x86_64" })).toBe("linux")
    expect(detectOsFamily({ userAgent: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0)", platform: "Linux x86_64" })).toBe("linux")
    expect(detectOsFamily({ userAgent: "Mozilla/5.0 (X11; Fedora; Linux x86_64)", platform: "Linux x86_64" })).toBe("linux")
  })

  it("detects Android as android, not linux", () => {
    expect(detectOsFamily({ userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8)", platform: "Linux armv8l" })).toBe("android")
  })

  it("detects iOS", () => {
    expect(detectOsFamily({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", platform: "iPhone" })).toBe("ios")
  })
})

describe("getMinerCta", () => {
  it("sends Linux visitors to the Start Mining Linux section, not a Mac dmg", () => {
    const cta = getMinerCta({
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      platform: "Linux x86_64",
    })
    expect(cta.kind).toBe("guide")
    expect(cta.href).toBe(LINUX_MINING_HREF)
    expect(cta.platform).toBe("linux")
    expect(cta.href).not.toMatch(/mac-arm64|dmg/)
  })

  it("offers the Windows installer on Windows", () => {
    const cta = getMinerCta({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", platform: "Win32" })
    expect(cta).toMatchObject({ kind: "download", platform: "win", href: "/api/download/win" })
  })

  it("defaults Mac to Apple Silicon when architecture is unknown", () => {
    const cta = getMinerCta({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", platform: "MacIntel" })
    expect(cta).toMatchObject({ kind: "download", platform: "mac-arm64", href: "/api/download/mac-arm64" })
  })

  it("uses userAgentData arm architecture for Apple Silicon", () => {
    const cta = getMinerCta({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      platform: "MacIntel",
      userAgentData: { architecture: "arm", platform: "macOS" },
    })
    expect(cta.platform).toBe("mac-arm64")
  })

  it("does not default unknown OS to a Mac download", () => {
    const cta = getMinerCta({ userAgent: "UnknownBot/1.0", platform: "" })
    expect(cta.kind).toBe("guide")
    expect(cta.href).toBe(START_MINING_HREF)
  })
})

describe("getMinerDownloadUrl", () => {
  it("returns the Linux guide for a Linux navigator", () => {
    const option = getMinerDownloadUrl({
      userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
      platform: "Linux x86_64",
    })
    expect(option.platform).toBe("linux")
    expect(option.url).toBe(LINUX_MINING_HREF)
  })
})
