export async function computeSHA256(data: ArrayBuffer): Promise<string> {
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function computeFileSHA256(file: File): Promise<string> {
  return computeSHA256(await file.arrayBuffer());
}
