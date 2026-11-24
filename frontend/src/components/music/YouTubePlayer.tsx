import { useEffect, useRef } from 'react';
interface Player { playVideo(): void; pauseVideo(): void; destroy(): void }
interface YouTubeApi { Player: new (element: HTMLElement, options: { videoId: string; width: string; height: string; playerVars: Record<string, string | number>; events: { onReady(): void; onStateChange(e: { data: number }): void; onError(): void } }) => Player }
declare global { interface Window { YT?: YouTubeApi; onYouTubeIframeAPIReady?: () => void } }
let ready: Promise<YouTubeApi> | undefined;
function load(): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!ready) ready = new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = 'https://www.youtube.com/iframe_api';
    const timer = window.setTimeout(() => { ready = undefined; reject(new Error('YouTube no responde')); }, 15000);
    window.onYouTubeIframeAPIReady = () => { clearTimeout(timer); resolve(window.YT!); };
    script.onerror = () => { clearTimeout(timer); ready = undefined; script.remove(); reject(new Error('YouTube no disponible')); };
    document.head.appendChild(script);
  });
  return ready;
}
export default function YouTubePlayer({ url, playing, onEnd, onError, onPlayingChange }: { url: string; playing: boolean; onEnd(): void; onError(): void; onPlayingChange?(playing:boolean):void }) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<Player | null>(null);
  const callbacks = useRef({ onEnd, onError, playing, onPlayingChange }); callbacks.current = { onEnd, onError, playing, onPlayingChange };
  useEffect(() => {
    let cancelled = false;
    load().then(YT => {
      if (cancelled || !host.current) return;
      const element = document.createElement('div'); host.current.replaceChildren(element);
      player.current = new YT.Player(element, { videoId: new URL(url).searchParams.get('v')!, width: '100%', height: '200',
        playerVars: { autoplay: 0, playsinline: 1, origin: window.location.origin },
        events: { onReady: () => { if (callbacks.current.playing) player.current?.playVideo?.(); },
          onStateChange: e => { if (e.data === 0) callbacks.current.onEnd(); else if (e.data === 1) callbacks.current.onPlayingChange?.(true); else if (e.data === 2) callbacks.current.onPlayingChange?.(false); },
          onError: () => callbacks.current.onError() },
      });
    }).catch(() => { if (!cancelled) callbacks.current.onError(); });
    return () => { cancelled = true; player.current?.destroy?.(); player.current = null; };
  }, [url]);
  useEffect(() => { if (playing) player.current?.playVideo?.(); else player.current?.pauseVideo?.(); }, [playing]);
  return <div ref={host} className="min-h-[200px] w-full"/>;
}
