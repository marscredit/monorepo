"use client"

import Link from "next/link"
import { formatDuration, formatEta, formatRemainingBlocks, milestoneState } from "@/lib/countdown"
import { links } from "@/lib/config"

interface MilestoneCountdownProps {
  block: number
  className?: string
}

export function MilestoneCountdown({ block, className = "" }: MilestoneCountdownProps) {
  const state = milestoneState(block)

  if (state.reached) {
    return (
      <div
        className={
          "rounded-2xl border border-mars-400/40 bg-mars-950/70 px-6 py-5 text-center shadow-[0_0_24px_rgba(204,0,0,0.2)] " +
          className
        }
      >
        <div className="text-xs font-medium uppercase tracking-widest text-mars-300 mb-2">Milestone</div>
        <div className="font-display text-2xl sm:text-3xl font-bold text-white">7,000,000+ blocks</div>
        <p className="mt-2 text-sm text-text-med">
          Mars Credit has passed seven million blocks. Live tip is {block.toLocaleString("en-US")}.
        </p>
        <a
          href={links.blockscan}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-mars-300 underline underline-offset-4 hover:text-mars-200"
        >
          View on Blockscan
        </a>
      </div>
    )
  }

  const seconds = state.etaMs / 1000

  return (
    <div
      className={
        "rounded-2xl border border-mars-500/30 bg-black/40 px-6 py-5 text-center " +
        className
      }
    >
      <div className="text-xs font-medium uppercase tracking-widest text-mars-300 mb-2">
        Countdown to block 7,000,000
      </div>
      <div className="font-mono text-3xl sm:text-4xl font-bold tabular-nums text-white">
        {formatRemainingBlocks(state.remaining)}
      </div>
      <div className="mt-1 text-sm text-text-med">blocks remaining</div>
      <p className="mt-3 text-sm text-text-med">
        About {formatDuration(seconds)} from now
        {state.eta ? (
          <>
            {" "}
            <span className="text-text-lo">(~{formatEta(state.eta)})</span>
          </>
        ) : null}
      </p>
      <p className="mt-1 text-xs text-text-lo">
        Estimate from live tip {block.toLocaleString("en-US")} at ~2s per block.{" "}
        <Link href="/start-mining" className="text-mars-300 underline underline-offset-4 hover:text-mars-200">
          Start mining
        </Link>
      </p>
    </div>
  )
}
