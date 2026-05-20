import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { IncomingTransfer } from '@/hooks/useTransfer';

function formatBytes(b: number) {
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(2)} GB`;
}

interface Props {
  transfer: IncomingTransfer | null;
  fromName: string;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function IncomingAlert({ transfer, fromName, onAccept, onReject }: Props) {
  return (
    <Dialog open={!!transfer && transfer.status === 'pending'}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Incoming from {fromName}</DialogTitle>
        </DialogHeader>
        {transfer && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-3 border border-stone-200">
              <span className="text-3xl">📁</span>
              <div>
                <p className="text-sm font-bold text-stone-900 truncate max-w-[200px]">{transfer.name}</p>
                <p className="text-xs text-stone-400">{formatBytes(transfer.size)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => onAccept(transfer.id)}
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-11"
              >
                ✓ Accept
              </Button>
              <Button
                variant="outline"
                onClick={() => onReject(transfer.id)}
                className="rounded-xl h-11 border-stone-200"
              >
                ✕ Decline
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
