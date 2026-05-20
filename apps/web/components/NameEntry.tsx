'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  onComplete: (name: string) => void;
}

export function NameEntry({ onComplete }: Props) {
  const [name, setName] = useState('');

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    onComplete(n);
  };

  return (
    <div className="flex h-dvh items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight">NearDrop</h1>
          <p className="text-sm text-stone-500 mt-2">Instant P2P file sharing — no account needed</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
            What should others see you as?
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="e.g. Ahmed's MacBook"
            maxLength={32}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-900 transition-colors placeholder:text-stone-400 mb-4"
          />
          <Button
            onClick={submit}
            disabled={!name.trim()}
            className="w-full bg-stone-900 text-white hover:bg-stone-700 rounded-xl h-10 text-sm font-bold"
          >
            Start →
          </Button>
        </div>
      </div>
    </div>
  );
}
