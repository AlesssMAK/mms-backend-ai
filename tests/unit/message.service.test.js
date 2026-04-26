import { describe, expect, it } from 'vitest';
import { computeBroadcastExpireAt } from '../../src/services/message.js';

describe('computeBroadcastExpireAt', () => {
  it('adds days to current timestamp', () => {
    const now = Date.now();
    const expireAt = computeBroadcastExpireAt(30);
    const diffMs = expireAt.getTime() - now;
    const diffDays = diffMs / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeGreaterThan(29.99);
    expect(diffDays).toBeLessThan(30.01);
  });

  it('returns null for non-positive or invalid input', () => {
    expect(computeBroadcastExpireAt(0)).toBeNull();
    expect(computeBroadcastExpireAt(-5)).toBeNull();
    expect(computeBroadcastExpireAt(NaN)).toBeNull();
    expect(computeBroadcastExpireAt('abc')).toBeNull();
    expect(computeBroadcastExpireAt(undefined)).toBeNull();
  });

  it('coerces numeric strings', () => {
    const expireAt = computeBroadcastExpireAt('7');
    const diffDays =
      (expireAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeGreaterThan(6.9);
    expect(diffDays).toBeLessThan(7.1);
  });
});
