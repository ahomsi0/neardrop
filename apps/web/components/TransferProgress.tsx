import { Progress } from '@/components/ui/progress';
import type { OutgoingTransfer, IncomingTransfer } from '@/hooks/useTransfer';
import { fileIcon, formatBytes } from '@/lib/fileIcons';

type Transfer = OutgoingTransfer | IncomingTransfer;

export function TransferProgress({ transfer }: { transfer: Transfer }) {
  const isDone  = transfer.status === 'done';
  const isError = transfer.status === 'error';
  const mime = 'mimeType' in transfer ? transfer.mimeType : undefined;

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl px-4 py-3 border border-stone-200 dark:border-stone-700 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{fileIcon(transfer.name, mime)}</span>
          <div>
            <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate max-w-[160px]">{transfer.name}</p>
            <p className="text-[10px] text-stone-400">{formatBytes(transfer.size)}</p>
          </div>
        </div>
        <span className={[
          'text-xs font-bold',
          isDone  ? 'text-green-600' :
          isError ? 'text-red-500'   : 'text-stone-900 dark:text-stone-100',
        ].join(' ')}>
          {isDone ? '✓ Done' : isError ? '✕ Failed' : `${transfer.progress}%`}
        </span>
      </div>
      {!isDone && !isError && (
        <Progress value={transfer.progress} className="h-1" />
      )}
    </div>
  );
}
