import { describe, expect, it } from 'vitest';
import { redactMeta, diffShallow } from '../../src/services/auditLog.js';

describe('redactMeta', () => {
  it('returns null for nullish input', () => {
    expect(redactMeta(null)).toBeNull();
    expect(redactMeta(undefined)).toBeNull();
  });

  it('redacts known sensitive keys at any depth', () => {
    const out = redactMeta({
      user: { email: 'a@b.com', password: 'secret' },
      tokens: 'abc',
      nested: { authorization: 'Bearer x' },
    });
    expect(out.user.password).toBe('[Redacted]');
    expect(out.tokens).toBe('[Redacted]');
    expect(out.nested.authorization).toBe('[Redacted]');
    expect(out.user.email).toBe('a@b.com'); // not in redact set
  });

  it('truncates long strings', () => {
    const long = 'x'.repeat(2500);
    const out = redactMeta({ note: long });
    expect(out.note.endsWith('…[Truncated]')).toBe(true);
    expect(out.note.length).toBeLessThanOrEqual(2500);
  });

  it('truncates over-deep nesting', () => {
    let payload = 'leaf';
    for (let i = 0; i < 10; i++) payload = { wrap: payload };
    const out = redactMeta(payload);
    // Walk down — at depth>4 we expect [Truncated]
    let cur = out;
    for (let i = 0; i < 5; i++) cur = cur.wrap;
    expect(cur).toBe('[Truncated]');
  });

  it('caps arrays at 50 items', () => {
    const arr = Array.from({ length: 100 }, (_, i) => i);
    const out = redactMeta({ list: arr });
    expect(out.list).toHaveLength(50);
  });
});

describe('diffShallow', () => {
  it('returns symmetric before/after for changed keys only', () => {
    const before = { a: 1, b: 2, c: 3 };
    const after = { a: 1, b: 99, d: 4 };
    const diff = diffShallow(before, after);
    expect(diff.before).toEqual({ b: 2, c: 3, d: undefined });
    expect(diff.after).toEqual({ b: 99, c: undefined, d: 4 });
  });

  it('handles nullish inputs', () => {
    expect(diffShallow(null, { a: 1 })).toEqual({
      before: { a: undefined },
      after: { a: 1 },
    });
  });

  it('returns empty diff when objects are equal', () => {
    expect(diffShallow({ a: 1 }, { a: 1 })).toEqual({ before: {}, after: {} });
  });
});
