'use client';
import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { Peer } from '@neardrop/shared';
import type { OutgoingTransfer } from '@/hooks/useTransfer';
import { TransferProgress } from './TransferProgress';

interface Props {
  peer: Peer;
  onSendFiles: (files: File[]) => void;
  onSendText: (text: string) => void;
  outgoing: OutgoingTransfer[];
}

export function SendPanel({ peer, onSendFiles, onSendText, outgoing }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

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

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Peer header */}
      <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-lg border border-stone-200">
          {peer.emoji}
        </div>
        <div>
          <p className="text-sm font-bold text-stone-900">{peer.displayName}</p>
          <p className="text-[10px] text-green-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
            P2P connected
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={[
          'flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center',
          'cursor-pointer transition-colors duration-150 min-h-[120px]',
          isDragging ? 'border-stone-900 bg-stone-50' : 'border-stone-300 bg-white hover:border-stone-400',
        ].join(' ')}
      >
        <span className="text-3xl mb-2">📂</span>
        <p className="text-sm font-bold text-stone-900">Drop files here</p>
        <p className="text-xs text-stone-400 mt-1">or tap to browse · any size</p>
        <input ref={inputRef} type="file" multiple className="hidden"
          onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) onSendFiles(f); }}
        />
      </div>

      {/* Active transfers */}
      {outgoing.map(t => <TransferProgress key={t.id} transfer={t} />)}

      {/* Text input */}
      <div className="flex gap-2 bg-white rounded-xl border border-stone-200 p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmitText())}
          placeholder="Send a text snippet..."
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
