'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import type { Peer } from '@neardrop/shared';
import type { OutgoingTransfer, IncomingTransfer } from '@/hooks/useTransfer';
import { TransferProgress } from './TransferProgress';
import { PeerAvatar } from './DesktopSidebar';
import type { HistoryEntry } from '@/lib/history';
import { clearHistory } from '@/lib/history';
import {
  IconSend, IconClipboard, IconFolder, IconFolderOpen,
  IconChevronUp, IconChevronDown, IconX,
  IconArrowUp, IconArrowDown, IconMessageCircle, IconFile,
} from '@/components/icons';

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

const URL_RE = /https?:\/\/[^\s<>"]+/g;

function MessageText({ content, sent }: { content: string; sent: boolean }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of content.matchAll(URL_RE)) {
    const idx = match.index!;
    if (idx > last) parts.push(content.slice(last, idx));
    parts.push(
      <a
        key={idx}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
        className={sent
          ? 'underline underline-offset-2 decoration-stone-400 hover:decoration-white'
          : 'underline underline-offset-2 decoration-stone-400 hover:decoration-stone-700 dark:hover:decoration-stone-300'
        }
        onClick={(e) => e.stopPropagation()}
      >
        {match[0]}
      </a>
    );
    last = idx + match[0].length;
  }
  if (last < content.length) parts.push(content.slice(last));
  return <p className="break-all">{parts}</p>;
}

export function SendPanel({ peer, messages, onSendFiles, onSendText, outgoing, incoming, history, onClearHistory }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef  = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
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
        <input ref={fileRef} type="file" multiple className="hidden"
          onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) onSendFiles(f); }}
        />
        <input
          ref={folderRef}
          type="file"
          // @ts-expect-error — webkitdirectory is non-standard
          webkitdirectory="true"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            if (!files.length) return;
            try {
              const zip = new JSZip();
              files.forEach(f => {
                const path = (f as File & { webkitRelativePath: string }).webkitRelativePath || f.name;
                zip.file(path, f);
              });
              const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
              const folderName = files[0]
                ? (files[0] as File & { webkitRelativePath: string }).webkitRelativePath.split('/')[0]
                : 'folder';
              const zipFile = new File([blob], `${folderName}.zip`, { type: 'application/zip' });
              onSendFiles([zipFile]);
            } catch (err) {
              console.error('[SendPanel] zip generation failed', err);
            } finally {
              e.target.value = '';
            }
          }}
        />
        <button
          onClick={async () => {
            try {
              const clipboardText = await navigator.clipboard.readText();
              if (!clipboardText.trim()) return;
              if (clipboardText.length > 500) {
                const blob = new Blob([clipboardText], { type: 'text/plain' });
                const file = new File([blob], `clipboard-${Date.now()}.txt`, { type: 'text/plain' });
                onSendFiles([file]);
              } else {
                setText(clipboardText.trim());
                inputRef.current?.focus();
              }
            } catch { /* permission denied or empty */ }
          }}
          className="p-1.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          title="Share clipboard"
          aria-label="Share clipboard"
        >
          <IconClipboard className="w-4 h-4" />
        </button>
        <button
          onClick={() => folderRef.current?.click()}
          className="flex items-center gap-1.5 text-xs font-bold bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 px-3 py-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          title="Send folder (zipped)"
          aria-label="Send folder"
        >
          <IconFolder className="w-3.5 h-3.5" /> Folder
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-xs font-bold bg-stone-900 dark:bg-stone-100 dark:text-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
        >
          <IconFile className="w-3.5 h-3.5" /> File
        </button>
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
            <IconFolderOpen className="w-10 h-10 text-stone-300 dark:text-stone-600 mb-2" />
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
                  <>
                    {t.mimeType.startsWith('image/') && (
                      <img src={t.previewUrl} alt={t.name}
                        className="mt-1 max-h-48 rounded-xl object-contain border border-stone-200 dark:border-stone-700 w-full"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    {t.mimeType.startsWith('video/') && (
                      <video src={t.previewUrl} controls playsInline aria-label={t.name}
                        className="mt-1 w-full max-h-48 rounded-xl border border-stone-200 dark:border-stone-700" />
                    )}
                    {t.mimeType.startsWith('audio/') && (
                      <audio src={t.previewUrl} controls aria-label={t.name}
                        className="mt-1 w-full rounded-xl" />
                    )}
                  </>
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
                    {historyOpen
                      ? <IconChevronUp className="w-3 h-3" />
                      : <IconChevronDown className="w-3 h-3" />
                    }
                  </button>
                  <button
                    onClick={() => { clearHistory(); onClearHistory(); }}
                    className="px-2 py-2 text-stone-400 hover:text-red-500 transition-colors bg-stone-50 dark:bg-stone-800 border-l border-stone-200 dark:border-stone-700"
                    title="Clear history"
                    aria-label="Clear history"
                  >
                    <IconX className="w-3.5 h-3.5" />
                  </button>
                </div>
                {historyOpen && (
                  <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-48 overflow-y-auto bg-white dark:bg-stone-900">
                    {[...history].reverse().map(h => (
                      <div key={h.id} className="flex items-center gap-2 px-3 py-2">
                        <span className="text-stone-400 dark:text-stone-500 shrink-0">
                          {h.kind === 'file'
                            ? <IconFile className="w-4 h-4" />
                            : <IconMessageCircle className="w-4 h-4" />
                          }
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">{h.name}</p>
                          <p className="text-[10px] text-stone-400 flex items-center gap-1">
                            {h.direction === 'sent'
                              ? <><IconArrowUp className="w-2.5 h-2.5" /> sent</>
                              : <><IconArrowDown className="w-2.5 h-2.5" /> received</>
                            }
                            {' · '}
                            {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  <MessageText content={m.content} sent={m.direction === 'sent'} />
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
          className="bg-stone-900 dark:bg-stone-100 dark:text-stone-900 text-white hover:bg-stone-700 dark:hover:bg-stone-300 rounded-lg text-xs px-3 flex items-center gap-1.5">
          Send <IconSend className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
