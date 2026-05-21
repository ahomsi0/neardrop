import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { Peer } from '@neardrop/shared';
import type { OutgoingTransfer } from '@/hooks/useTransfer';
import type { HistoryEntry } from '@/lib/history';
import { SendPanel, type Message } from './SendPanel';

interface Props {
  peer: Peer | null;
  open: boolean;
  onClose: () => void;
  onSendFiles: (files: File[]) => void;
  onSendText: (text: string) => void;
  outgoing: OutgoingTransfer[];
  messages: Message[];
  history: HistoryEntry[];
}

export function SendSheet({ peer, open, onClose, onSendFiles, onSendText, outgoing, messages, history }: Props) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl h-[90dvh] bg-stone-50 p-0">
        <div className="w-8 h-1 bg-stone-300 rounded-full mx-auto mt-3 mb-4" />
        <div className="px-4 pb-4 h-[calc(100%-36px)]">
          {peer && (
            <SendPanel
              peer={peer}
              messages={messages.filter(m => m.peerId === peer.id)}
              onSendFiles={onSendFiles}
              onSendText={onSendText}
              outgoing={outgoing.filter(t => t.peerId === peer.id)}
              history={history.filter(h => h.peerId === peer.id)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
