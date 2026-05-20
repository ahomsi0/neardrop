export const LARGE_FILE_THRESHOLD = 500 * 1024 * 1024; // 500MB

export class MemoryAssembler {
  private chunks = new Map<number, ArrayBuffer>();
  constructor(private mimeType: string, private totalChunks: number) {}

  addChunk(index: number, data: ArrayBuffer): void {
    this.chunks.set(index, data);
  }

  isComplete(): boolean {
    return this.chunks.size === this.totalChunks;
  }

  assemble(): Blob {
    const ordered: ArrayBuffer[] = [];
    for (let i = 0; i < this.totalChunks; i++) {
      const chunk = this.chunks.get(i);
      if (chunk === undefined) throw new Error(`MemoryAssembler: missing chunk at index ${i}`);
      ordered.push(chunk);
    }
    return new Blob(ordered, { type: this.mimeType });
  }
}

export class IndexedDBAssembler {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'neardrop';
  private readonly STORE = 'chunks';

  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        (e.target as IDBOpenDBRequest).result.createObjectStore(this.STORE);
      };
      req.onsuccess = (e) => { this.db = (e.target as IDBOpenDBRequest).result; resolve(); };
      req.onerror = () => reject(req.error);
    });
  }

  async storeChunk(transferId: string, index: number, data: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.STORE, 'readwrite');
      tx.objectStore(this.STORE).put(data, `${transferId}:${index}`);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async assemble(transferId: string, totalChunks: number, mimeType: string): Promise<Blob> {
    const parts: ArrayBuffer[] = [];
    for (let i = 0; i < totalChunks; i++) {
      parts.push(await this.getChunk(transferId, i));
    }
    return new Blob(parts, { type: mimeType });
  }

  private async getChunk(transferId: string, index: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.STORE, 'readonly');
      const req = tx.objectStore(this.STORE).get(`${transferId}:${index}`);
      req.onsuccess = () => resolve(req.result as ArrayBuffer);
      req.onerror = () => reject(req.error);
    });
  }

  async cleanup(transferId: string, totalChunks: number): Promise<void> {
    const tx = this.db!.transaction(this.STORE, 'readwrite');
    const store = tx.objectStore(this.STORE);
    for (let i = 0; i < totalChunks; i++) {
      store.delete(`${transferId}:${i}`);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
