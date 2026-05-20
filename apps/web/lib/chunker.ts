export const CHUNK_SIZE = 64 * 1024; // 64KB

export function getTotalChunks(fileSize: number): number {
  return Math.ceil(fileSize / CHUNK_SIZE);
}

export async function* chunkFile(
  file: File
): AsyncGenerator<{ index: number; encoded: ArrayBuffer }> {
  let index = 0;
  let offset = 0;
  while (offset < file.size) {
    const slice = file.slice(offset, offset + CHUNK_SIZE);
    const data = await slice.arrayBuffer();
    yield { index, encoded: encodeChunk(index, data) };
    index++;
    offset += CHUNK_SIZE;
  }
}

export function encodeChunk(index: number, data: ArrayBuffer): ArrayBuffer {
  const buf = new ArrayBuffer(4 + data.byteLength);
  new DataView(buf).setUint32(0, index, false);
  new Uint8Array(buf, 4).set(new Uint8Array(data));
  return buf;
}

export function decodeChunk(buffer: ArrayBuffer): { index: number; data: ArrayBuffer } {
  const index = new DataView(buffer).getUint32(0, false);
  return { index, data: buffer.slice(4) };
}
