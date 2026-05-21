'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
  onJoin: (code: string, password: string | null) => void;
}

export function RoomCodeInput({ open, onClose, onJoin }: Props) {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) return;
    onJoin(trimmed, password.trim() || null);
    setCode('');
    setPassword('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xs rounded-2xl dark:bg-stone-900 dark:border-stone-700">
        <DialogHeader>
          <DialogTitle className="dark:text-stone-100">Join a Room</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="WOLF42"
            className="font-mono text-center text-xl tracking-widest h-12 border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            autoFocus
          />
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="Password (if required)"
            type="password"
            className="border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
          />
          <Button
            onClick={handleJoin}
            disabled={code.trim().length < 4}
            className="w-full bg-stone-900 dark:bg-stone-100 dark:text-stone-900 text-white hover:bg-stone-700 rounded-xl h-11"
          >
            Join Room
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
