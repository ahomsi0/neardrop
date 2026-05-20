import { describe, it, expect } from 'vitest';
import { getClientIp } from '../discovery';

describe('getClientIp', () => {
  it('uses x-forwarded-for when present', () => {
    expect(getClientIp('203.0.113.1, 10.0.0.1', '::1')).toBe('203.0.113.1');
  });
  it('strips ::ffff: prefix from IPv4-mapped IPv6', () => {
    expect(getClientIp(undefined, '::ffff:1.2.3.4')).toBe('1.2.3.4');
  });
  it('returns remoteAddress when no forwarded header', () => {
    expect(getClientIp(undefined, '1.2.3.4')).toBe('1.2.3.4');
  });
});
