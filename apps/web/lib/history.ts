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
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'); } catch { return []; }
}

export function saveHistory(entries: HistoryEntry[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(-200))); } catch { /* ignore */ }
}

export function clearHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
}
