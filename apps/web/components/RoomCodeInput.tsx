'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
  onJoin: (code: string) => void;
}

export function RoomCodeInput({ open, onClose, onJoin }: Props) {
  const [code, setCode] = useState('');

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) return;
    onJoin(trimmed);
    setCode('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xs rounded-2xl">
        <DialogHeader>
          <DialogTitle>Join a Room</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="WOLF42"
            className="font-mono text-center text-xl tracking-widest h-12 border-stone-200"
            autoFocus
          />
          <Button
            onClick={handleJoin}
            disabled={code.trim().length < 4}
            className="w-full bg-stone-900 text-white hover:bg-stone-700 rounded-xl h-11"
          >
            Join Room
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
