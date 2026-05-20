import type { Peer } from '@neardrop/shared';

interface Props {
  peer: Peer;
  isYou?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function DeviceNode({ peer, isYou, isSelected, onClick, style }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={isYou}
      style={style}
      className={[
        'absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2',
        'transition-transform duration-150',
        !isYou && 'hover:scale-110 cursor-pointer',
      ].filter(Boolean).join(' ')}
    >
      <div className={[
        'flex items-center justify-center rounded-full text-2xl',
        'shadow-sm transition-all duration-150',
        isYou    ? 'w-14 h-14 bg-stone-900 ring-2 ring-stone-900'
                 : 'w-12 h-12 bg-white border-2',
        isSelected ? 'border-stone-900 ring-2 ring-stone-900' : 'border-stone-200',
      ].join(' ')}>
        {peer.emoji}
      </div>
      <span className="text-[10px] font-bold text-stone-900 whitespace-nowrap max-w-[80px] truncate">
        {isYou ? 'You' : peer.displayName}
      </span>
      {!isYou && (
        <span className="text-[8px] text-green-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          online
        </span>
      )}
    </button>
  );
}
