import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { IncomingTransfer } from '@/hooks/useTransfer';
import { FileTypeIcon, IconCheck, IconX } from '@/components/icons';
import { formatBytes } from '@/lib/fileIcons';

interface Props {
  transfer: IncomingTransfer | null;
  fromName: string;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function IncomingAlert({ transfer, fromName, onAccept, onReject }: Props) {
  const open = !!transfer && transfer.status === 'pending';

  if (!open || !transfer) return null;

  const filePreview = (
    <div className="flex items-center gap-3">
      <span className="text-stone-400 dark:text-stone-500">
        <FileTypeIcon name={transfer.name} mimeType={transfer.mimeType} className="w-9 h-9" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
          {fromName} is sending
        </p>
        <p className="text-base font-bold text-stone-900 dark:text-stone-100 truncate">{transfer.name}</p>
        <p className="text-sm text-stone-400">{formatBytes(transfer.size)}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: fixed bottom banner */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xl p-4">
          <div className="mb-4">{filePreview}</div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onReject(transfer.id)}
              variant="outline"
              className="h-14 rounded-2xl text-base border-stone-200 dark:border-stone-700 dark:text-stone-100 flex items-center gap-2"
            >
              <IconX className="w-4 h-4" /> Decline
            </Button>
            <Button
              onClick={() => onAccept(transfer.id)}
              className="h-14 rounded-2xl text-base bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <IconCheck className="w-4 h-4" /> Accept
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
            <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-3 border border-stone-200 dark:border-stone-700">
              {filePreview}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => onAccept(transfer.id)}
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 flex items-center gap-2"
              >
                <IconCheck className="w-4 h-4" /> Accept
              </Button>
              <Button
                variant="outline"
                onClick={() => onReject(transfer.id)}
                className="rounded-xl h-11 border-stone-200 dark:border-stone-700 dark:text-stone-100 flex items-center gap-2"
              >
                <IconX className="w-4 h-4" /> Decline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
