import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkAndConsume,
  resetRateLimiter,
} from '../../src/services/email/rateLimiter.js';

// Mock systemSettings.getSettings — keep tests independent from Mongo.
vi.mock('../../src/services/systemSettings.js', () => ({
  getSettings: vi.fn(),
  invalidateCache: vi.fn(),
}));

import { getSettings } from '../../src/services/systemSettings.js';

const mockLimit = (perRecipientPerHour) =>
  vi.mocked(getSettings).mockResolvedValue({
    email: { rateLimits: { perRecipientPerHour } },
  });

describe('email rateLimiter', () => {
  beforeEach(() => {
    resetRateLimiter();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('allows up to the limit then blocks', async () => {
    mockLimit(3);
    for (let i = 0; i < 3; i++) {
      const r = await checkAndConsume('a@b.com');
      expect(r.allowed).toBe(true);
      expect(r.used).toBe(i + 1);
    }
    const blocked = await checkAndConsume('a@b.com');
    expect(blocked.allowed).toBe(false);
    expect(blocked.used).toBe(3);
  });

  it('treats recipients independently and case-insensitively', async () => {
    mockLimit(1);
    expect((await checkAndConsume('a@b.com')).allowed).toBe(true);
    expect((await checkAndConsume('A@B.COM')).allowed).toBe(false); // same key
    expect((await checkAndConsume('other@b.com')).allowed).toBe(true);
  });

  it('prunes timestamps older than 1h, allowing new sends', async () => {
    mockLimit(2);
    await checkAndConsume('x@y.com');
    await checkAndConsume('x@y.com');
    expect((await checkAndConsume('x@y.com')).allowed).toBe(false);

    vi.advanceTimersByTime(60 * 60 * 1000 + 1000); // jump 1h+1s

    const r = await checkAndConsume('x@y.com');
    expect(r.allowed).toBe(true);
  });

  it('treats limit<=0 as a hard block', async () => {
    mockLimit(0);
    const r = await checkAndConsume('x@y.com');
    expect(r.allowed).toBe(false);
    expect(r.limit).toBe(0);
  });
});
