import { Progress } from '@/components/ui/progress';
import type { OutgoingTransfer, IncomingTransfer } from '@/hooks/useTransfer';

type Transfer = OutgoingTransfer | IncomingTransfer;

function fileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['mp4','mov','avi','mkv'].includes(ext)) return '🎬';
  if (['jpg','jpeg','png','gif','webp','heic'].includes(ext)) return '🖼';
  if (['pdf'].includes(ext)) return '📄';
  if (['zip','tar','gz','rar'].includes(ext)) return '📦';
  return '📁';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export function TransferProgress({ transfer }: { transfer: Transfer }) {
  const isDone  = transfer.status === 'done';
  const isError = transfer.status === 'error';

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl px-4 py-3 border border-stone-200 dark:border-stone-700 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{fileIcon(transfer.name)}</span>
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
