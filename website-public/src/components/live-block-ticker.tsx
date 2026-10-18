"use client"

import { useState, useEffect } from "react"

// Matches the ~2s target block time after the mars-fast1 fork.
const BLOCK_INTERVAL_MS = 2000
// Re-sync with the real chain tip from /api/network on this cadence.
const SYNC_INTERVAL_MS = 10000

function formatBlockNumber(n: number): string {
  return n.toLocaleString()
}

interface LiveBlockTickerProps {
  initialBlock: number
  className?: string
}

export function LiveBlockTicker({ initialBlock, className = "" }: LiveBlockTickerProps) {
  const [block, setBlock] = useState(initialBlock)

  useEffect(() => {
    setBlock(initialBlock)
  }, [initialBlock])

  useEffect(() => {
    let cancelled = false

    const sync = () => {
      fetch("/api/network", { cache: "no-store" })
        .then((res) => res.json())
        .then((data: { block?: number }) => {
          if (!cancelled && typeof data?.block === "number" && data.block > 0) {
            const tip = data.block
            // Jump to the real tip; only keep a locally ticked value if it is a few blocks ahead.
            setBlock((prev) => (prev > tip && prev - tip <= 5 ? prev : tip))
          }
        })
        .catch(() => {})
    }

    // Tick between syncs so the counter keeps moving.
    const tick = setInterval(() => {
      if (document.visibilityState === "visible") setBlock((prev) => prev + 1)
    }, BLOCK_INTERVAL_MS)
    const poll = setInterval(sync, SYNC_INTERVAL_MS)

    // Background tabs throttle timers, so re-sync as soon as the tab is visible again.
    const onVisible = () => {
      if (document.visibilityState === "visible") sync()
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onVisible)

    return () => {
      cancelled = true
      clearInterval(tick)
      clearInterval(poll)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onVisible)
    }
  }, [])

  return (
    <div
      className={
        "relative overflow-hidden rounded-lg border border-mars-500/30 bg-mars-950/60 px-6 py-4 text-center " +
        "shadow-[0_0_20px_rgba(204,0,0,0.15)] " +
        className
      }
    >
      {/* Scan line overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.06]"
        aria-hidden
      >
        <div
          className="h-px w-full bg-gradient-to-r from-transparent via-mars-300 to-transparent animate-scan-line"
          style={{
            boxShadow: "0 0 8px rgba(255, 68, 51, 0.3)",
          }}
        />
      </div>

      {/* LIVE indicator */}
      <div className="mb-2 flex items-center justify-center gap-2">
        <span
          className="h-2 w-2 rounded-full bg-mars-400 animate-glow-pulse"
          style={{
            boxShadow: "0 0 8px rgba(204, 0, 0, 0.8)",
          }}
        />
        <span className="text-xs font-medium uppercase tracking-widest text-mars-300/90">
          Live
        </span>
      </div>

      {/* Block label + number - holographic glow */}
      <div className="text-xs font-medium uppercase tracking-widest text-mars-400/80 mb-0.5">
        Block
      </div>
      <div
        className="font-mono text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl"
        style={{
          textShadow:
            "0 0 10px rgba(255, 68, 51, 0.5), 0 0 20px rgba(204, 0, 0, 0.3), 0 0 30px rgba(153, 0, 0, 0.2)",
        }}
      >
        {formatBlockNumber(block)}
      </div>
      <div className="mt-1 text-xs font-medium uppercase tracking-widest text-mars-400/70">
        Blocks scanned
      </div>
    </div>
  )
}
