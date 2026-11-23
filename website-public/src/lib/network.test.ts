import { describe, expect, it, vi, afterEach } from "vitest"
import { FALLBACK_BLOCK, fetchNetworkStatus } from "./network"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("fetchNetworkStatus", () => {
  it("parses a hex eth_blockNumber from RPC", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body))
        if (body.method === "eth_blockNumber") {
          return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: "0x66e7d0" }), { status: 200 })
        }
        if (body.method === "net_peerCount") {
          return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: "0x8" }), { status: 200 })
        }
        return new Response("nope", { status: 404 })
      }),
    )

    const status = await fetchNetworkStatus({ cache: "no-store" })
    expect(status.source).toBe("rpc")
    expect(status.block).toBe(0x66e7d0)
    expect(status.peers).toBe(8)
  })

  it("falls back when RPC is down instead of returning a years-old tip", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 502 })))
    const status = await fetchNetworkStatus({ cache: "no-store", timeoutMs: 50 })
    expect(status.source).toBe("fallback")
    expect(status.block).toBe(FALLBACK_BLOCK)
    expect(status.block).toBeGreaterThan(6_000_000)
  })
})
