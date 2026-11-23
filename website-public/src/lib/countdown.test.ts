import { describe, expect, it } from "vitest"
import { formatDuration, MILESTONE_BLOCK, milestoneState } from "./countdown"

describe("milestoneState", () => {
  const now = Date.parse("2026-11-23T23:00:00Z")

  it("counts remaining blocks and ETA at ~2s", () => {
    const tip = 6_740_000
    const state = milestoneState(tip, now)
    expect(state.reached).toBe(false)
    if (state.reached) return
    expect(state.remaining).toBe(260_000)
    expect(state.etaMs).toBe(260_000 * 2000)
    expect(state.eta?.getTime()).toBe(now + 260_000 * 2000)
  })

  it("switches to celebratory state at 7,000,000", () => {
    expect(milestoneState(MILESTONE_BLOCK, now)).toEqual({
      reached: true,
      remaining: 0,
      etaMs: 0,
      eta: null,
    })
    expect(milestoneState(MILESTONE_BLOCK + 12, now).reached).toBe(true)
  })

  it("does not go negative before genesis-scale tips", () => {
    const state = milestoneState(0, now)
    expect(state.reached).toBe(false)
    if (state.reached) return
    expect(state.remaining).toBe(MILESTONE_BLOCK)
  })
})

describe("formatDuration", () => {
  it("formats days hours minutes", () => {
    expect(formatDuration(6 * 86400 + 5 * 3600 + 12 * 60)).toBe("6d 5h 12m")
  })

  it("returns now for zero/negative", () => {
    expect(formatDuration(0)).toBe("now")
    expect(formatDuration(-10)).toBe("now")
  })
})
