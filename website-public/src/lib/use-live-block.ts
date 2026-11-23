"use client"

import { useEffect, useState } from "react"
import { AVG_BLOCK_TIME_MS, NETWORK_POLL_MS } from "@/lib/network"

export function useLiveBlock(initialBlock: number): number {
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
            setBlock((prev) => (prev > tip && prev - tip <= 5 ? prev : tip))
          }
        })
        .catch(() => {})
    }

    sync()

    const tick = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        setBlock((prev) => prev + 1)
      }
    }, AVG_BLOCK_TIME_MS)
    const poll = setInterval(sync, NETWORK_POLL_MS)

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

  return block
}
