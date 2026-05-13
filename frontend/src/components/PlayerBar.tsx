import { useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music2, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { useAudioStore, type Track } from '../store/useAudioStore';
import { useUserStore } from '../store/useUserStore';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Slider } from './ui/slider';

function formatTime(seconds: number | undefined) {
  if (seconds === undefined || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function PlayerBar() {
  const { currentTrack, isPlaying, progress, volume, togglePlay, setVolume, seek, updateProgress, nextTrack, prevTrack, activePlaylist, setTracks, isShuffle, repeatMode, toggleShuffle, toggleRepeatMode } = useAudioStore();
  const currentUser = useUserStore((state) => state.currentUser);

  const updatePlaybackMutation = useMutation({
    mutationFn: async (data: { trackId: string; position: number }) => {
      if (!currentUser) return;
      await fetch(`http://localhost:3000/users/${currentUser.id}/playback-state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
  });

  // Effect to save playback state periodically
  useEffect(() => {
    if (!currentTrack || !currentUser) return;

    // Save state when pausing or unmounting
    if (!isPlaying && progress > 0) {
      updatePlaybackMutation.mutate({
        trackId: currentTrack.id,
        position: progress,
      });
    }

    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        updatePlaybackMutation.mutate({
          trackId: currentTrack.id,
          position: useAudioStore.getState().progress,
        });
      }, 10000); // Save every 10 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentTrack?.id, currentUser?.id]);
  
  const { data: tracks } = useQuery<Track[]>({ 
    queryKey: ['tracks', activePlaylist],
    queryFn: async () => {
      const url = new URL('http://localhost:3000/tracks');
      if (activePlaylist) url.searchParams.append('playlist', activePlaylist);
      const res = await fetch(url.toString());
      return res.json();
    }
  });

  useEffect(() => {
    if (tracks) {
      setTracks(tracks);
    }
  }, [tracks, setTracks]);

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    if (isPlaying) {
      interval = setInterval(updateProgress, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, updateProgress]);

  if (!currentTrack) return null;

  return (
    <div className="h-24 bg-background border-t border-border px-4 md:px-6 flex items-center justify-between shadow-2xl z-50">
      
      {/* Track Info */}
      <div className="flex items-center gap-3 w-1/4 md:w-1/3 min-w-0">
        <div className="w-12 h-12 md:w-14 md:h-14 bg-secondary rounded-md flex items-center justify-center flex-shrink-0">
          <Music2 className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
        </div>
        <div className="truncate hidden sm:block">
          <div className="font-medium text-foreground truncate hover:underline cursor-pointer">{currentTrack.title}</div>
          <div className="text-xs text-muted-foreground truncate hover:underline cursor-pointer">{currentTrack.artist}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center justify-center gap-2 flex-1 md:w-1/3 max-w-xl">
        <div className="flex items-center gap-4 md:gap-6">
          <button onClick={toggleShuffle} className={`transition hidden md:block ${isShuffle ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <Shuffle className="w-4 h-4" />
          </button>
          
          <button onClick={() => prevTrack()} className="text-muted-foreground hover:text-foreground transition">
            <SkipBack className="w-5 h-5 md:w-5 md:h-5" fill="currentColor" />
          </button>
          
          <button 
            onClick={togglePlay} 
            className="w-10 h-10 md:w-10 md:h-10 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5 ml-1" fill="currentColor" />
            )}
          </button>

          <button onClick={() => nextTrack()} className="text-muted-foreground hover:text-foreground transition">
            <SkipForward className="w-5 h-5 md:w-5 md:h-5" fill="currentColor" />
          </button>

          <button onClick={toggleRepeatMode} className={`transition hidden md:block ${repeatMode !== 'off' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-3 w-full group">
          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right hidden md:block">{formatTime(progress)}</span>
          <Slider
            value={[progress]}
            max={currentTrack.duration || 100}
            step={1}
            onValueChange={(vals) => seek(vals[0])}
            className="w-full"
          />
          <span className="text-xs text-muted-foreground tabular-nums w-10 hidden md:block">{formatTime(currentTrack.duration)}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="hidden md:flex items-center justify-end gap-3 w-1/3">
        <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="text-muted-foreground hover:text-foreground transition">
          {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <div className="w-24 flex items-center">
          <Slider
            value={[volume * 100]}
            max={100}
            step={1}
            onValueChange={(vals) => setVolume(vals[0] / 100)}
            className="w-full"
          />
        </div>
      </div>

    </div>
  );
}
