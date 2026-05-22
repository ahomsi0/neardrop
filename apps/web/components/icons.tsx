/**
 * Custom SVG icon components — stroke-based, Lucide-compatible style.
 * All icons: viewBox 0 0 24 24, stroke="currentColor", fill="none",
 * strokeWidth="1.5", strokeLinecap="round", strokeLinejoin="round".
 * Default size class: w-4 h-4 (override via className).
 */

interface IconProps {
  className?: string;
  strokeWidth?: number;
}

function base(strokeWidth = 1.5) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

export function IconSend({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function IconArrowLeft({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M19 12H5" />
      <path d="M12 19 5 12 12 5" />
    </svg>
  );
}

export function IconArrowUp({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M12 19V5" />
      <path d="M5 12 12 5 19 12" />
    </svg>
  );
}

export function IconArrowDown({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M12 5v14" />
      <path d="M19 12 12 19 5 12" />
    </svg>
  );
}

export function IconChevronUp({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M18 15 12 9 6 15" />
    </svg>
  );
}

export function IconChevronDown({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M6 9 12 15 18 9" />
    </svg>
  );
}

export function IconX({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function IconCheck({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M20 6 9 17 4 12" />
    </svg>
  );
}

export function IconClipboard({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

export function IconFolder({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

export function IconFolderOpen({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M6 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v1" />
      <path d="M14 9V7a2 2 0 0 0-2-2H5.93a2 2 0 0 0-1.66.9l-1.5 2.2A2 2 0 0 0 2 9" />
    </svg>
  );
}

export function IconMessageCircle({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

export function IconLock({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function IconLink({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function IconHome({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

export function IconSave({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5L3.5 6.4c-.3.3-.5.7-.5 1.1V20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5L15.5 2Z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

export function IconZap({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

/* ── File-type icons ──────────────────────────────────────────── */

export function IconFile({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

export function IconFileImage({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <circle cx="10" cy="13" r="2" />
      <path d="m20 17-1.8-1.8a2 2 0 0 0-2.8 0L12 18" />
    </svg>
  );
}

export function IconFileVideo({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="m10 11 5 3-5 3v-6z" />
    </svg>
  );
}

export function IconFileAudio({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M9 18c0 1.1.9 2 2 2s2-.9 2-2v-5l3-1" />
      <path d="M11 13h3" />
    </svg>
  );
}

export function IconFilePDF({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M9 13v-1h1a1 1 0 0 1 0 2H9v2" />
      <path d="M14 12h1.5a1 1 0 0 1 0 2H14v-4" />
      <path d="M18 12v4" />
    </svg>
  );
}

export function IconFileArchive({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M12 12v6" />
      <path d="M10 12h4" />
      <path d="M10 16h4" />
    </svg>
  );
}

export function IconFileText({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 13h6M10 17h4" />
    </svg>
  );
}

export function IconFileSpreadsheet({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M8 13h2v5H8zM14 13h2v3h-2z" />
      <path d="M11 15h2v3h-2z" />
    </svg>
  );
}

export function IconFilePresentation({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <rect x="8" y="12" width="8" height="5" rx="1" />
      <path d="M12 12v-2" />
    </svg>
  );
}

export function IconMicrophone({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

export function IconStop({ className = 'w-4 h-4', strokeWidth }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

/* ── FileTypeIcon — maps name/mime to the right icon ─────────── */

export function FileTypeIcon({
  name,
  mimeType,
  className = 'w-[1em] h-[1em]',
  strokeWidth,
}: {
  name: string;
  mimeType?: string;
  className?: string;
  strokeWidth?: number;
}) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const mime = mimeType ?? '';
  const p = { className, strokeWidth };

  if (mime.startsWith('image/') || ['jpg','jpeg','png','gif','webp','heic','avif','svg'].includes(ext))
    return <IconFileImage {...p} />;
  if (mime.startsWith('video/') || ['mp4','mov','avi','mkv','webm'].includes(ext))
    return <IconFileVideo {...p} />;
  if (mime.startsWith('audio/') || ['mp3','wav','flac','aac','ogg','m4a'].includes(ext))
    return <IconFileAudio {...p} />;
  if (mime === 'application/pdf' || ext === 'pdf')
    return <IconFilePDF {...p} />;
  if (['zip','tar','gz','rar','7z','bz2'].includes(ext) || mime.includes('zip') || mime.includes('compressed'))
    return <IconFileArchive {...p} />;
  if (mime.startsWith('text/') || ['txt','md','csv','json','xml','yaml','yml','toml'].includes(ext))
    return <IconFileText {...p} />;
  if (['doc','docx'].includes(ext))
    return <IconFileText {...p} />;
  if (['xls','xlsx'].includes(ext))
    return <IconFileSpreadsheet {...p} />;
  if (['ppt','pptx'].includes(ext))
    return <IconFilePresentation {...p} />;
  return <IconFile {...p} />;
}
