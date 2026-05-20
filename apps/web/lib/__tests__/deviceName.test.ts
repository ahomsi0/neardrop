import { describe, it, expect } from 'vitest';
import { generateDeviceName, detectDeviceType } from '../deviceName';

describe('generateDeviceName', () => {
  it('returns a displayName with two capitalized words', () => {
    const { displayName } = generateDeviceName();
    const parts = displayName.split(' ');
    expect(parts).toHaveLength(2);
    expect(parts[0][0]).toBe(parts[0][0].toUpperCase());
    expect(parts[1][0]).toBe(parts[1][0].toUpperCase());
  });

  it('returns a non-empty emoji', () => {
    const { emoji } = generateDeviceName();
    expect(emoji.length).toBeGreaterThan(0);
  });

  it('produces different names on repeated calls', () => {
    const names = new Set(Array.from({ length: 20 }, () => generateDeviceName().displayName));
    expect(names.size).toBeGreaterThan(5);
  });
});

describe('detectDeviceType', () => {
  it('returns desktop for default jsdom userAgent', () => {
    expect(detectDeviceType()).toBe('desktop');
  });

  it('returns mobile for mobile userAgent', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
      configurable: true,
    });
    expect(detectDeviceType()).toBe('mobile');
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (X11; Linux x86_64)',
      configurable: true,
    });
  });
});
