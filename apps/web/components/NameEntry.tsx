'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ANIMALS, getOrCreateIdentity } from '@/lib/deviceName';

interface Props {
  onComplete: (name: string, emoji: string) => void;
}

export function NameEntry({ onComplete }: Props) {
  const defaultEmoji = getOrCreateIdentity().emoji;
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(defaultEmoji);

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    onComplete(n, selectedEmoji);
  };

  return (
    <div className="flex h-dvh items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">NearDrop</h1>
          <p className="text-sm text-stone-500 mt-2">Instant P2P file sharing — no account needed</p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-5">
          {/* Emoji picker */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-3">
              Pick your icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {ANIMALS.map(({ emoji, name: label }) => (
                <button
                  key={emoji}
                  type="button"
                  title={label}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={[
                    'aspect-square rounded-xl text-2xl flex items-center justify-center transition-all',
                    selectedEmoji === emoji
                      ? 'bg-stone-900 dark:bg-stone-100 scale-105 shadow-sm'
                      : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700',
                  ].join(' ')}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              What should others see you as?
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="e.g. Ahmed's MacBook"
              maxLength={32}
              className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors placeholder:text-stone-400"
            />
          </div>

          {/* Preview + submit */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-xl shrink-0">
              {selectedEmoji}
            </div>
            <Button
              onClick={submit}
              disabled={!name.trim()}
              className="flex-1 bg-stone-900 dark:bg-stone-100 dark:text-stone-900 text-white hover:bg-stone-700 rounded-xl h-10 text-sm font-bold"
            >
              Start →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
