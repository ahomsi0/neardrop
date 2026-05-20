'use client';
import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  roomCode: string | null;
  open: boolean;
  onClose: () => void;
}

export function QRCodePanel({ roomCode, open, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!roomCode || !canvasRef.current) return;
    const url = `${window.location.origin}/room/${roomCode}`;
    QRCode.toCanvas(canvasRef.current, url, { width: 200, margin: 2 });
  }, [roomCode, open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xs rounded-2xl text-center">
        <DialogHeader>
          <DialogTitle>Share Room</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <canvas ref={canvasRef} className="rounded-xl" />
          <div>
            <p className="text-xs text-stone-400 mb-1">Room code</p>
            <p className="font-mono text-2xl font-bold text-stone-900 tracking-widest">{roomCode}</p>
          </div>
          <p className="text-xs text-stone-400">Expires after 10 minutes of inactivity</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
