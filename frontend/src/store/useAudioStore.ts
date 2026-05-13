import { create } from 'zustand';
import { Howl } from 'howler';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  year?: number | null;
  duration: number;
  path: string;
  filename: string;
  playlist: string | null;
  createdAt: string;
}

interface AudioState {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  howl: Howl | null;
  playTrack: (track: Track, options?: { startPaused?: boolean; seekTo?: number }) => void;
  togglePlay: () => void;
  seek: (position: number) => void;
  setVolume: (volume: number) => void;
  updateProgress: () => void;
  prevTrack: () => void;
  activePlaylist: string | null;
  setActivePlaylist: (playlist: string | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  tracks: Track[];
  setTracks: (tracks: Track[]) => void;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  toggleShuffle: () => void;
  toggleRepeatMode: () => void;
  nextTrack: (autoAdvance?: boolean) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  activePlaylist: null,
  setActivePlaylist: (playlist) => set({ activePlaylist: playlist, searchTerm: '' }), // Clear search on playlist change
  searchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  volume: 1,
  howl: null,
  tracks: [],
  setTracks: (tracks) => set({ tracks }),
  isShuffle: false,
  repeatMode: 'all',
  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
  toggleRepeatMode: () => set((state) => {
    const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
    const nextIndex = (modes.indexOf(state.repeatMode) + 1) % modes.length;
    return { repeatMode: modes[nextIndex] };
  }),

  playTrack: (track: Track, options?: { startPaused?: boolean; seekTo?: number }) => {
    const { howl } = get();
    if (howl) {
      howl.unload();
    }

    const newHowl = new Howl({
      src: [`http://localhost:3000/audio/stream/${track.id}`],
      html5: true, // Force HTML5 Audio to allow partial content streaming
      volume: get().volume,
      format: ['mp3', 'flac', 'm4a', 'wav'],
      onplay: () => {
        set({ isPlaying: true });
      },
      onpause: () => {
        set({ isPlaying: false });
      },
      onend: () => {
        set({ isPlaying: false, progress: 0 });
        // Use setTimeout to avoid race conditions with Howler's internal cleanup
        setTimeout(() => {
          const { repeatMode } = get();
          if (repeatMode === 'one') {
            get().playTrack(track, { seekTo: 0 }); // Replay from start
          } else {
            get().nextTrack(true);
          }
        }, 100);
      },
      onloaderror: (_id, error) => {
        console.error('Howler load error:', error);
        // Skip broken track automatically
        setTimeout(() => get().nextTrack(true), 1000);
      },
      onplayerror: (_id, error) => {
        console.error('Howler play error:', error);
        newHowl.once('unlock', () => {
          newHowl.play();
        });
      },
    });

    const newState: Partial<AudioState> = {
      currentTrack: track,
      howl: newHowl,
    };

    if (!options?.startPaused) {
      newHowl.play();
      newState.isPlaying = true;
    } else {
      newState.isPlaying = false;
    }

    if (options?.seekTo !== undefined) {
      newHowl.seek(options.seekTo);
      newState.progress = options.seekTo;
    } else {
      newState.progress = 0;
    }

    set(newState);
  },

  togglePlay: () => {
    const { howl, isPlaying } = get();
    if (howl) {
      if (isPlaying) {
        howl.pause();
      } else {
        howl.play();
      }
    }
  },

  seek: (position: number) => {
    const { howl } = get();
    if (howl) {
      howl.seek(position);
      set({ progress: position });
    }
  },

  setVolume: (volume: number) => {
    const { howl } = get();
    if (howl) {
      howl.volume(volume);
    }
    set({ volume });
  },

  updateProgress: () => {
    const { howl, isPlaying } = get();
    if (howl && isPlaying) {
      set({ progress: howl.seek() as number });
    }
  },

  nextTrack: (autoAdvance = false) => {
    const { currentTrack, tracks, isShuffle, repeatMode } = get();
    if (!currentTrack || tracks.length === 0) return;
    
    if (isShuffle) {
      let randomIndex = Math.floor(Math.random() * tracks.length);
      // Try to avoid playing the same track again immediately if there are multiple tracks
      if (tracks.length > 1 && tracks[randomIndex].id === currentTrack.id) {
        randomIndex = (randomIndex + 1) % tracks.length;
      }
      get().playTrack(tracks[randomIndex]);
      return;
    }

    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = currentIndex + 1;

    if (autoAdvance && repeatMode === 'off' && nextIndex >= tracks.length) {
      return; // Stop playback
    }

    get().playTrack(tracks[nextIndex % tracks.length]);
  },

  prevTrack: () => {
    const { currentTrack, tracks } = get();
    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    get().playTrack(tracks[prevIndex]);
  },
}));
