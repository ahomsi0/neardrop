'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { Peer } from '@neardrop/shared';
import type { OutgoingTransfer, IncomingTransfer } from '@/hooks/useTransfer';
import { TransferProgress } from './TransferProgress';
import { PeerAvatar } from './DesktopSidebar';
import type { HistoryEntry } from '@/lib/history';
import { clearHistory } from '@/lib/history';

export interface Message {
  id: string;
  peerId: string;
  content: string;
  direction: 'sent' | 'received';
  timestamp: number;
}

interface Props {
  peer: Peer;
  messages: Message[];
  onSendFiles: (files: File[]) => void;
  onSendText: (text: string) => void;
  outgoing: OutgoingTransfer[];
  incoming: IncomingTransfer[];
  history: HistoryEntry[];
  onClearHistory: () => void;
}

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function SendPanel({ peer, messages, onSendFiles, onSendText, outgoing, incoming, history, onClearHistory }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef  = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItem = items.find(i => i.type.startsWith('image/'));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          const ext = file.type.split('/')[1]?.split('+')[0] ?? 'png';
          const named = new File([file], `pasted-image-${Date.now()}.${ext}`, { type: file.type });
          onSendFiles([named]);
          return;
        }
      }
      const textItem = items.find(i => i.kind === 'string' && i.type === 'text/plain');
      if (textItem) {
        textItem.getAsString((str) => {
          if (str.trim()) setText(str);
        });
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onSendFiles, setText]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onSendFiles(files);
  }, [onSendFiles]);

  const handleSubmitText = useCallback(() => {
    if (!text.trim()) return;
    onSendText(text.trim());
    setText('');
  }, [text, onSendText]);

  const hasActivity = messages.length > 0 || outgoing.length > 0 || incoming.length > 0 || history.length > 0;

  return (
    <div className="flex flex-col gap-3 h-full w-full">
      {/* Peer header */}
      <div className="flex items-center gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
        <PeerAvatar peer={peer} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">{peer.displayName}</p>
          <p className="text-[10px] text-green-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
            P2P connected
          </p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="text-xs font-bold bg-stone-900 dark:bg-stone-100 dark:text-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
        >
          + File
        </button>
        <input ref={fileRef} type="file" multiple className="hidden"
          onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) onSendFiles(f); }}
        />
      </div>

      {/* Activity feed: messages + transfers */}
      <div
        className="flex-1 overflow-y-auto flex flex-col"
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
      >
        {!hasActivity && (
          <div
            className={[
              'flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center',
              'cursor-pointer transition-colors duration-150',
              isDragging
                ? 'border-stone-900 bg-stone-50 dark:border-stone-400 dark:bg-stone-800'
                : 'border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500',
            ].join(' ')}
            onClick={() => fileRef.current?.click()}
          >
            <span className="text-3xl mb-2">📂</span>
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100">Drop files here</p>
            <p className="text-xs text-stone-400 mt-1">or tap to browse · any size</p>
          </div>
        )}

        {hasActivity && (
          <div className="mt-auto flex flex-col gap-2 pb-2">
            {outgoing.map(t => (
              <div key={t.id}>
                <TransferProgress transfer={t} />
                {t.previewUrl && (
                  <img src={t.previewUrl} alt={t.name}
                    className="mt-1 max-h-48 rounded-xl object-contain border border-stone-200 dark:border-stone-700 w-full"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                )}
              </div>
            ))}
            {incoming.map(t => (
              <div key={t.id}>
                <TransferProgress transfer={t} />
                {t.previewUrl && (
                  <img src={t.previewUrl} alt={t.name}
                    className="mt-1 max-h-48 rounded-xl object-contain border border-stone-200 dark:border-stone-700 w-full"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                )}
              </div>
            ))}

            {/* Transfer history */}
            {history.length > 0 && (
              <div className="border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
                <div className="w-full flex items-center">
                  <button
                    onClick={() => setHistoryOpen(o => !o)}
                    className="flex-1 flex items-center justify-between px-3 py-2 text-[11px] font-bold text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700"
                  >
                    <span>History ({history.length})</span>
                    <span>{historyOpen ? '▲' : '▼'}</span>
                  </button>
                  <button
                    onClick={() => { clearHistory(); onClearHistory(); }}
                    className="px-2 py-2 text-[10px] text-stone-400 hover:text-red-500 transition-colors bg-stone-50 dark:bg-stone-800 border-l border-stone-200 dark:border-stone-700"
                    title="Clear history"
                    aria-label="Clear history"
                  >
                    ✕
                  </button>
                </div>
                {historyOpen && (
                  <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-48 overflow-y-auto bg-white dark:bg-stone-900">
                    {[...history].reverse().map(h => (
                      <div key={h.id} className="flex items-center gap-2 px-3 py-2">
                        <span className="text-base">{h.kind === 'file' ? '📁' : '💬'}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">{h.name}</p>
                          <p className="text-[10px] text-stone-400">
                            {h.direction === 'sent' ? '↑ sent' : '↓ received'} · {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {h.status === 'error' && <span className="text-red-500 text-[10px]">failed</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            {messages.map(m => (
              <div key={m.id} className={['flex', m.direction === 'sent' ? 'justify-end' : 'justify-start'].join(' ')}>
                <div className={[
                  'max-w-[75%] px-3 py-2 rounded-2xl text-sm',
                  m.direction === 'sent'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-br-sm'
                    : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-bl-sm',
                ].join(' ')}>
                  <p>{m.content}</p>
                  <p className="text-[9px] mt-1 text-stone-400 dark:text-stone-500">
                    {fmt(m.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Text input */}
      <div className="flex gap-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-2">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmitText())}
          placeholder="Send a message or text snippet..."
          className="flex-1 text-sm bg-transparent outline-none text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 px-2"
        />
        <Button size="sm" onClick={handleSubmitText} disabled={!text.trim()}
          className="bg-stone-900 dark:bg-stone-100 dark:text-stone-900 text-white hover:bg-stone-700 dark:hover:bg-stone-300 rounded-lg text-xs px-3">
          Send ↗
        </Button>
      </div>
    </div>
  );
}
