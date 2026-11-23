export const MILESTONE_BLOCK = 7_000_000
export const AVG_BLOCK_TIME_SEC = 2

export type MilestoneState =
  | {
      reached: false
      remaining: number
      etaMs: number
      eta: Date
    }
  | {
      reached: true
      remaining: 0
      etaMs: 0
      eta: null
    }

export function milestoneState(
  tip: number,
  nowMs: number = Date.now(),
  target: number = MILESTONE_BLOCK,
  blockTimeSec: number = AVG_BLOCK_TIME_SEC,
): MilestoneState {
  const remaining = Math.max(0, target - Math.floor(tip))
  if (remaining === 0) {
    return { reached: true, remaining: 0, etaMs: 0, eta: null }
  }
  const etaMs = remaining * blockTimeSec * 1000
  return {
    reached: false,
    remaining,
    etaMs,
    eta: new Date(nowMs + etaMs),
  }
}

export function formatRemainingBlocks(n: number): string {
  return n.toLocaleString("en-US")
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "now"
  const total = Math.round(seconds)
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0 || days > 0) parts.push(`${hours}h`)
  parts.push(`${minutes}m`)
  return parts.join(" ")
}

export function formatEta(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date)
}
