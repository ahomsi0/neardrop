import { describe, it, expect } from 'vitest';
import { computeSHA256 } from '../checksum';

describe('computeSHA256', () => {
  it('returns a 64-char hex string', async () => {
    const buf = new TextEncoder().encode('hello').buffer;
    const hash = await computeSHA256(buf);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('returns same hash for same input', async () => {
    const buf = new TextEncoder().encode('test').buffer;
    const [h1, h2] = await Promise.all([computeSHA256(buf), computeSHA256(buf)]);
    expect(h1).toBe(h2);
  });

  it('returns different hashes for different inputs', async () => {
    const a = new TextEncoder().encode('foo').buffer;
    const b = new TextEncoder().encode('bar').buffer;
    expect(await computeSHA256(a)).not.toBe(await computeSHA256(b));
  });
});
