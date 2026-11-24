export function youtubeId(input: string): string {
  const url = new URL(input);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) throw new Error('URL inválida');
  const host = url.hostname.toLowerCase();
  let id: string | null = null;
  if (host === 'youtu.be') id = url.pathname.split('/')[1];
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else if (/^\/(shorts|embed|live)\//.test(url.pathname)) id = url.pathname.split('/')[2];
  }
  if (!id || !/^[\w-]{11}$/.test(id)) throw new Error('URL inválida');
  return id;
}
export function mediaKind(b: Buffer, name: string): 'mp3' | 'mp4' {
  if (!b.length || b.length > 25 * 1024 * 1024) throw new Error('Tamaño inválido');
  if (/\.mp3$/i.test(name) && (b.toString('ascii', 0, 3) === 'ID3' || (b.length > 3 && b[0] === 255 && (b[1] & 224) === 224))) return 'mp3';
  if (/\.mp4$/i.test(name) && b.length > 12 && b.toString('ascii', 4, 8) === 'ftyp') return 'mp4';
  throw new Error('Formato inválido');
}
