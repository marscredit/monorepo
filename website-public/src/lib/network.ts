export const RPC_PRIMARY = process.env.MARS_RPC_PRIMARY || "https://rpc.marscredit.xyz"
export const RPC_FALLBACK = process.env.MARS_RPC_FALLBACK || "https://rpc2.marscredit.xyz"

/**
 * Last-resort tip if every RPC is unreachable. Kept near the live chain
 * (7M ETA ~29 Nov 2026) so first paint is not years behind. Prefer a live
 * fetch; never treat this as authoritative.
 */
export const FALLBACK_BLOCK = 6_730_000

export const AVG_BLOCK_TIME_MS = 2000
export const NETWORK_POLL_MS = 10_000
export const RPC_TIMEOUT_MS = 2500

export type NetworkStatus = {
  block: number
  peers?: number
  updatedAt: string
  source: "rpc" | "fallback"
}

function parseHexBlock(hex: unknown): number | null {
  if (typeof hex !== "string" || !hex.startsWith("0x")) return null
  const n = Number.parseInt(hex, 16)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

async function ethBlockNumber(rpc: string, cache: RequestCache | undefined, timeoutMs: number): Promise<number> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
      cache,
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new Error(`RPC ${rpc} HTTP ${res.status}`)
    }
    const json: { result?: unknown } = await res.json()
    const block = parseHexBlock(json.result)
    if (block == null) {
      throw new Error(`RPC ${rpc} returned an unusable eth_blockNumber`)
    }
    return block
  } finally {
    clearTimeout(timer)
  }
}

async function ethPeerCount(rpc: string, cache: RequestCache | undefined, timeoutMs: number): Promise<number | undefined> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "net_peerCount", params: [] }),
      cache,
      signal: controller.signal,
    })
    if (!res.ok) return undefined
    const json: { result?: unknown } = await res.json()
    const n = parseHexBlock(json.result)
    return n ?? undefined
  } catch {
    return undefined
  } finally {
    clearTimeout(timer)
  }
}

const RPCS = [RPC_PRIMARY, RPC_FALLBACK].filter((url, i, all) => url && all.indexOf(url) === i)

/**
 * Fetch the chain tip from public Mars Credit RPC. Does not mine; read-only.
 * `cache: 'no-store'` for API routes; ISR pages may pass undefined and rely on
 * Next's `next.revalidate` via the route segment config.
 */
export async function fetchNetworkStatus(options?: {
  cache?: RequestCache
  timeoutMs?: number
}): Promise<NetworkStatus> {
  const cache = options?.cache
  const timeoutMs = options?.timeoutMs ?? RPC_TIMEOUT_MS
  let lastError: unknown

  for (const rpc of RPCS) {
    try {
      const block = await ethBlockNumber(rpc, cache, timeoutMs)
      const peers = await ethPeerCount(rpc, cache, timeoutMs)
      return {
        block,
        peers,
        updatedAt: new Date().toISOString(),
        source: "rpc",
      }
    } catch (error) {
      lastError = error
      console.warn("[network] RPC tip fetch failed", { rpc, error: error instanceof Error ? error.message : String(error) })
    }
  }

  console.warn("[network] all RPCs failed; using FALLBACK_BLOCK", {
    fallback: FALLBACK_BLOCK,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  })

  return {
    block: FALLBACK_BLOCK,
    updatedAt: new Date().toISOString(),
    source: "fallback",
  }
}
