import { formatMarsDuration, isMarsChain, marsMilestoneState, MARS_MILESTONE_BLOCK } from './milestone';

describe('isMarsChain', () => {
  it('matches chain 110110 only', () => {
    expect(isMarsChain('110110')).toBe(true);
    expect(isMarsChain('1')).toBe(false);
    expect(isMarsChain(undefined)).toBe(false);
  });
});

describe('marsMilestoneState', () => {
  it('counts remaining blocks at ~2s', () => {
    const state = marsMilestoneState(6_740_000);
    expect(state).toEqual({ reached: false, remaining: 260_000, etaSeconds: 520_000 });
  });

  it('celebrates at and after 7,000,000', () => {
    expect(marsMilestoneState(MARS_MILESTONE_BLOCK)).toEqual({ reached: true, remaining: 0, etaSeconds: 0 });
    expect(marsMilestoneState(MARS_MILESTONE_BLOCK + 1).reached).toBe(true);
  });
});

describe('formatMarsDuration', () => {
  it('formats a multi-day ETA', () => {
    expect(formatMarsDuration(6 * 86400 + 5 * 3600)).toBe('6d 5h 0m');
  });
});
