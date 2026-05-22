'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getOrCreateIdentity } from '@/lib/deviceName';
import { PeerAvatarLg } from './DesktopSidebar';

interface Props {
  onComplete: (name: string, emoji: string) => void;
}

export function NameEntry({ onComplete }: Props) {
  const identity = getOrCreateIdentity();
  const [name, setName] = useState('');

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    onComplete(n, ''); // emoji field no longer used
  };

  // Show badge preview based on live name (fall back to identity id for gradient)
  const previewName = name.trim() || 'You';

  return (
    <div className="flex h-dvh items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">NearDrop</h1>
          <p className="text-sm text-stone-500 mt-2">Instant P2P file sharing — no account needed</p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-5">

          {/* Badge preview */}
          <div className="flex flex-col items-center gap-3 py-2">
            <PeerAvatarLg id={identity.id} displayName={previewName} size={64} />
            <p className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">
              Your badge is unique to this device
            </p>
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

          {/* Submit */}
          <Button
            onClick={submit}
            disabled={!name.trim()}
            className="w-full bg-stone-900 dark:bg-stone-100 dark:text-stone-900 text-white hover:bg-stone-700 rounded-xl h-10 text-sm font-bold"
          >
            Start →
          </Button>
        </div>
      </div>
    </div>
  );
}
