import { describe, it, expect } from 'vitest';
import { CHUNK_SIZE, getTotalChunks, encodeChunk, decodeChunk } from '../chunker';

describe('getTotalChunks', () => {
  it('returns 1 for file smaller than chunk size', () => {
    expect(getTotalChunks(1000)).toBe(1);
  });
  it('returns correct count for exact multiple', () => {
    expect(getTotalChunks(CHUNK_SIZE * 3)).toBe(3);
  });
  it('rounds up for partial last chunk', () => {
    expect(getTotalChunks(CHUNK_SIZE * 2 + 1)).toBe(3);
  });
});

describe('encodeChunk / decodeChunk', () => {
  it('round-trips chunk index and data', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]).buffer;
    const encoded = encodeChunk(42, data);
    const { index, data: decoded } = decodeChunk(encoded);
    expect(index).toBe(42);
    expect(new Uint8Array(decoded)).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
  });
  it('handles index 0', () => {
    const data = new ArrayBuffer(0);
    expect(decodeChunk(encodeChunk(0, data)).index).toBe(0);
  });
});
