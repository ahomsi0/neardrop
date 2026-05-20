import { describe, it, expect } from 'vitest';
import { MemoryAssembler } from '../assembler';

describe('MemoryAssembler', () => {
  it('assembles chunks into a Blob in order', async () => {
    const asm = new MemoryAssembler('text/plain', 3);
    asm.addChunk(1, new TextEncoder().encode('world').buffer);
    asm.addChunk(0, new TextEncoder().encode('hello').buffer);
    asm.addChunk(2, new TextEncoder().encode('!').buffer);
    const blob = asm.assemble();
    const text = await blob.text();
    expect(text).toBe('helloworld!');
  });

  it('reports complete when all chunks received', () => {
    const asm = new MemoryAssembler('text/plain', 2);
    expect(asm.isComplete()).toBe(false);
    asm.addChunk(0, new ArrayBuffer(1));
    asm.addChunk(1, new ArrayBuffer(1));
    expect(asm.isComplete()).toBe(true);
  });
});
