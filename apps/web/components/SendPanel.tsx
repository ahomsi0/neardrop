'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { Peer } from '@neardrop/shared';
import type { OutgoingTransfer } from '@/hooks/useTransfer';
import { TransferProgress } from './TransferProgress';

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
}

export function SendPanel({ peer, messages, onSendFiles, onSendText, outgoing }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const hasActivity = messages.length > 0 || outgoing.length > 0;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Peer header */}
      <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-lg border border-stone-200">
          {peer.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-stone-900 truncate">{peer.displayName}</p>
          <p className="text-[10px] text-green-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
            P2P connected
          </p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="text-xs font-bold bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-700 transition-colors"
        >
          + File
        </button>
        <input ref={fileRef} type="file" multiple className="hidden"
          onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) onSendFiles(f); }}
        />
      </div>

      {/* Activity feed: messages + transfers */}
      <div
        className="flex-1 overflow-y-auto"
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
      >
        {!hasActivity && (
          <div
            className={[
              'h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center',
              'cursor-pointer transition-colors duration-150',
              isDragging ? 'border-stone-900 bg-stone-50' : 'border-stone-200',
            ].join(' ')}
            onClick={() => fileRef.current?.click()}
          >
            <span className="text-3xl mb-2">📂</span>
            <p className="text-sm font-bold text-stone-900">Drop files here</p>
            <p className="text-xs text-stone-400 mt-1">or tap to browse · any size</p>
          </div>
        )}

        {hasActivity && (
          <div className="flex flex-col gap-2 pb-2">
            {outgoing.map(t => <TransferProgress key={t.id} transfer={t} />)}
            {messages.map(m => (
              <div key={m.id} className={['flex', m.direction === 'sent' ? 'justify-end' : 'justify-start'].join(' ')}>
                <div className={[
                  'max-w-[75%] px-3 py-2 rounded-2xl text-sm',
                  m.direction === 'sent'
                    ? 'bg-stone-900 text-white rounded-br-sm'
                    : 'bg-white border border-stone-200 text-stone-900 rounded-bl-sm',
                ].join(' ')}>
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Text input */}
      <div className="flex gap-2 bg-white rounded-xl border border-stone-200 p-2">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmitText())}
          placeholder="Send a message or text snippet..."
          className="flex-1 text-sm bg-transparent outline-none text-stone-900 placeholder:text-stone-400 px-2"
        />
        <Button size="sm" onClick={handleSubmitText} disabled={!text.trim()}
          className="bg-stone-900 text-white hover:bg-stone-700 rounded-lg text-xs px-3">
          Send ↗
        </Button>
      </div>
    </div>
  );
}
