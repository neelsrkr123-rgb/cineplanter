// src/components/YouTubePlayer.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  onEnd?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
}

export default function YouTubePlayer({ videoId, onEnd, onPlay, onPause }: YouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // @ts-ignore
    window.onYouTubeIframeAPIReady = () => {
      if (playerRef.current) {
        const newPlayer = new (window as any).YT.Player(playerRef.current, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            'playsinline': 1,
            'modestbranding': 1,
            'rel': 0,
            'showinfo': 0,
            'controls': 1
          },
          events: {
            'onReady': () => {
              console.log('Player is ready');
            },
            'onStateChange': (event: any) => {
              if (event.data === (window as any).YT.PlayerState.ENDED) {
                onEnd?.();
              } else if (event.data === (window as any).YT.PlayerState.PLAYING) {
                onPlay?.();
              } else if (event.data === (window as any).YT.PlayerState.PAUSED) {
                onPause?.();
              }
            }
          }
        });
        setPlayer(newPlayer);
      }
    };

    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [videoId]);

  return (
    <div className="w-full h-full bg-black">
      <div ref={playerRef} className="w-full h-full" />
    </div>
  );
}