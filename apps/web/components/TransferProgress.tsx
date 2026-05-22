import { Progress } from '@/components/ui/progress';
import type { OutgoingTransfer, IncomingTransfer } from '@/hooks/useTransfer';
import { formatBytes } from '@/lib/fileIcons';
import { FileTypeIcon, IconCheck, IconX } from '@/components/icons';

type Transfer = OutgoingTransfer | IncomingTransfer;

export function TransferProgress({ transfer }: { transfer: Transfer }) {
  const isDone  = transfer.status === 'done';
  const isError = transfer.status === 'error';
  const mime = 'mimeType' in transfer ? transfer.mimeType : undefined;

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl px-4 py-3 border border-stone-200 dark:border-stone-700 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-lg text-stone-500 dark:text-stone-400">
            <FileTypeIcon name={transfer.name} mimeType={mime} className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate max-w-[160px]">{transfer.name}</p>
            <p className="text-[10px] text-stone-400">{formatBytes(transfer.size)}</p>
          </div>
        </div>
        <span className={[
          'text-xs font-bold flex items-center gap-1',
          isDone  ? 'text-green-600' :
          isError ? 'text-red-500'   : 'text-stone-900 dark:text-stone-100',
        ].join(' ')}>
          {isDone  ? <><IconCheck className="w-3.5 h-3.5" /> Done</>   :
           isError ? <><IconX     className="w-3.5 h-3.5" /> Failed</> :
           `${transfer.progress}%`}
        </span>
      </div>
      {!isDone && !isError && (
        <Progress value={transfer.progress} className="h-1" />
      )}
    </div>
  );
}
