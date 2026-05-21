export function fileIcon(name: string, mimeType?: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const mime = mimeType ?? '';
  if (mime.startsWith('image/') || ['jpg','jpeg','png','gif','webp','heic','avif','svg'].includes(ext)) return '🖼️';
  if (mime.startsWith('video/') || ['mp4','mov','avi','mkv','webm'].includes(ext)) return '🎬';
  if (mime.startsWith('audio/') || ['mp3','wav','flac','aac','ogg','m4a'].includes(ext)) return '🎵';
  if (mime === 'application/pdf' || ext === 'pdf') return '📄';
  if (['zip','tar','gz','rar','7z','bz2'].includes(ext) || mime.includes('zip') || mime.includes('compressed')) return '📦';
  if (mime.startsWith('text/') || ['txt','md','csv','json','xml','yaml','yml','toml'].includes(ext)) return '📝';
  if (['doc','docx'].includes(ext)) return '📃';
  if (['xls','xlsx'].includes(ext)) return '📊';
  if (['ppt','pptx'].includes(ext)) return '📑';
  return '📁';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export function isImage(name: string, mimeType?: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const mime = mimeType ?? '';
  return mime.startsWith('image/') || ['jpg','jpeg','png','gif','webp','heic','avif'].includes(ext);
}

export function isMedia(name: string, mimeType?: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const mime = mimeType ?? '';
  return mime.startsWith('video/') || mime.startsWith('audio/')
    || ['mp4','mov','avi','mkv','webm','mp3','wav','flac','aac','ogg','m4a'].includes(ext);
}
