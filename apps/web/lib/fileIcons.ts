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
