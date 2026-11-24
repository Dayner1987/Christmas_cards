import { api } from './http';
export interface Track { id: string; title: string; kind: 'mp3' | 'mp4' | 'youtube'; url: string; active: boolean }
export const getTracks = async (admin = false): Promise<Track[]> => (await api.get(admin ? '/music/admin' : '/music')).data;
export function trackForm(title: string, file: File | null, youtubeUrl: string) {
  const data = new FormData(); data.append('title', title.trim());
  if (file) {
    if (!/\.(mp3|mp4)$/i.test(file.name) || file.size > 25 * 1024 * 1024) throw new Error('Selecciona un MP3 o MP4 de hasta 25 MB.');
    data.append('file', file);
  } else if (youtubeUrl.trim()) data.append('youtubeUrl', youtubeUrl.trim());
  return data;
}
