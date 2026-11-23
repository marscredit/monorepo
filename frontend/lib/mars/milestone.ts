export const MARS_CHAIN_ID = '110110';
export const MARS_MILESTONE_BLOCK = 7_000_000;
export const MARS_AVG_BLOCK_TIME_SEC = 2;

export type MarsMilestoneState =
  | { reached: false; remaining: number; etaSeconds: number }
  | { reached: true; remaining: 0; etaSeconds: 0 };

export function isMarsChain(chainId: string | undefined): boolean {
  return chainId === MARS_CHAIN_ID;
}

export function marsMilestoneState(
  tip: number,
  target: number = MARS_MILESTONE_BLOCK,
  blockTimeSec: number = MARS_AVG_BLOCK_TIME_SEC,
): MarsMilestoneState {
  const remaining = Math.max(0, target - Math.floor(tip));
  if (remaining === 0) {
    return { reached: true, remaining: 0, etaSeconds: 0 };
  }
  return { reached: false, remaining, etaSeconds: remaining * blockTimeSec };
}

export function formatMarsDuration(seconds: number): string {
  if (seconds <= 0) {
    return 'now';
  }
  const total = Math.round(seconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const parts: Array<string> = [];
  if (days > 0) {
    parts.push(`${ days }d`);
  }
  if (hours > 0 || days > 0) {
    parts.push(`${ hours }h`);
  }
  parts.push(`${ minutes }m`);
  return parts.join(' ');
}
