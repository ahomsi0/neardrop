/**
 * Persists chat messages to localStorage so they survive page refreshes.
 * Keyed by peerName (display name) so conversations survive socket ID changes.
 */

export interface PersistedMessage {
  id: string;
  peerId: string;      // socket ID at time of send — used for live session matching
  peerName: string;    // stable display name — used for cross-session matching
  content: string;
  direction: 'sent' | 'received';
  timestamp: number;
}

const MESSAGES_KEY = 'neardrop-messages';
const MAX_MESSAGES  = 500;

export function loadPersistedMessages(): PersistedMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(MESSAGES_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function savePersistedMessages(messages: PersistedMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Keep the most recent MAX_MESSAGES entries
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  } catch { /* storage full — ignore */ }
}

export function clearPersistedMessages(): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(MESSAGES_KEY); } catch { /* ignore */ }
}
