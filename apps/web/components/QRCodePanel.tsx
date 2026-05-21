'use client';
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  roomCode: string | null;
  open: boolean;
  onClose: () => void;
  onCreateWithPassword: (password: string | null) => void;
  passwordSet: boolean;
}

export function QRCodePanel({ roomCode, open, onClose, onCreateWithPassword, passwordSet }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<'password' | 'qr'>('password');
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) { setStep('password'); setPassword(''); }
  }, [open]);

  useEffect(() => {
    if (step !== 'qr' || !roomCode || !canvasRef.current) return;
    const url = `${window.location.origin}/room/${roomCode}`;
    QRCode.toCanvas(canvasRef.current, url, { width: 200, margin: 2 });
  }, [roomCode, step]);

  const handleCreate = () => {
    onCreateWithPassword(password.trim() || null);
    setStep('qr');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xs rounded-2xl text-center dark:bg-stone-900 dark:border-stone-700">
        <DialogHeader>
          <DialogTitle className="dark:text-stone-100">
            {step === 'password' ? 'Create Room' : 'Share Room'}
          </DialogTitle>
        </DialogHeader>

        {step === 'password' && (
          <div className="space-y-3 py-2">
            <p className="text-xs text-stone-400">Optional: set a password so only people you share it with can join.</p>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Leave blank for no password"
              type="password"
              className="border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            />
            <Button
              onClick={handleCreate}
              className="w-full bg-stone-900 dark:bg-stone-100 dark:text-stone-900 text-white rounded-xl h-10"
            >
              Create Room →
            </Button>
          </div>
        )}

        {step === 'qr' && (
          <div className="flex flex-col items-center gap-4 py-2">
            <canvas ref={canvasRef} className="rounded-xl" />
            <div>
              <p className="text-xs text-stone-400 mb-1">Room code</p>
              <p className="font-mono text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-widest">{roomCode}</p>
            </div>
            {passwordSet && (
              <p className="text-xs text-amber-600 font-medium">🔒 Password protected</p>
            )}
            <button
              onClick={async () => {
                const url = `${window.location.origin}/room/${roomCode}`;
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 px-3 py-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              {copied ? '✓ Copied!' : '🔗 Copy link'}
            </button>
            <p className="text-xs text-stone-400">Expires after 10 minutes of inactivity</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
