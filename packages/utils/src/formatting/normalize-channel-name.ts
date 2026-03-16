export function normalizeChannelName(channel: string): string {
  return channel.trim().toUpperCase().replace(/\s+/g, "_");
}
