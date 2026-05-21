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
  const open = !!transfer && transfer.status === 'pending';

  if (!open || !transfer) return null;

  return (
    <>
      {/* Mobile: fixed bottom banner */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">📁</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                {fromName} is sending
              </p>
              <p className="text-base font-bold text-stone-900 dark:text-stone-100 truncate">{transfer.name}</p>
              <p className="text-sm text-stone-400">{formatBytes(transfer.size)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onReject(transfer.id)}
              variant="outline"
              className="h-14 rounded-2xl text-base border-stone-200 dark:border-stone-700 dark:text-stone-100"
            >
              ✕ Decline
            </Button>
            <Button
              onClick={() => onAccept(transfer.id)}
              className="h-14 rounded-2xl text-base bg-green-600 hover:bg-green-700 text-white"
            >
              ✓ Accept
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop: centered dialog */}
      <Dialog open={open}>
        <DialogContent className="hidden md:block max-w-sm rounded-2xl dark:bg-stone-900 dark:border-stone-700">
          <DialogHeader>
            <DialogTitle className="text-base dark:text-stone-100">Incoming from {fromName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-800 rounded-xl p-3 border border-stone-200 dark:border-stone-700">
              <span className="text-3xl">📁</span>
              <div>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate max-w-[200px]">{transfer.name}</p>
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
                className="rounded-xl h-11 border-stone-200 dark:border-stone-700 dark:text-stone-100"
              >
                ✕ Decline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
