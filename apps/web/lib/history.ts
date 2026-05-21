export interface HistoryEntry {
  id: string;
  peerId: string;
  kind: 'file' | 'text';
  name: string;
  direction: 'sent' | 'received';
  timestamp: number;
  status: 'done' | 'error';
}

const HISTORY_KEY = 'neardrop-history';

export function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? '[]'); } catch { return []; }
}

export function saveHistory(entries: HistoryEntry[]) {
  try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(-200))); } catch { /* ignore */ }
}
