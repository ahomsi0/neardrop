export function getClientIp(
  forwardedFor: string | undefined,
  remoteAddress: string
): string {
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return remoteAddress.replace(/^::ffff:/, '');
}
