import { QueryClient, QueryClientProvider, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { PlayerBar } from './components/PlayerBar';
import { TrackList } from './components/TrackList';
import { useAudioStore, type Track } from './store/useAudioStore'; // Import Track type
import { Loader2, UploadCloud } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { Button } from './components/ui/button';
import { ThemeProvider } from './components/theme-provider';
import { MobileNav } from './components/mobile-nav';
import { useUserStore } from './store/useUserStore';
import { AuthPage } from './components/AuthPage';

const queryClient = new QueryClient();

function MainContent() {
  const activePlaylist = useAudioStore((state) => state.activePlaylist);
  const localQueryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      if (activePlaylist) {
        formData.append('playlist', activePlaylist);
      }
      const res = await fetch('http://localhost:3000/scanner/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: () => {
      localQueryClient.invalidateQueries({ queryKey: ['tracks'] });
      localQueryClient.invalidateQueries({ queryKey: ['playlists'] });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
      e.target.value = '';
    }
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background md:bg-secondary/20 md:rounded-tl-2xl md:mt-2 relative">
      <MobileNav />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {activePlaylist ? activePlaylist : 'All Tracks'}
          </h1>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="flex items-center gap-2"
          >
            {uploadMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            Upload Track
          </Button>
          <input 
            type="file" 
            accept=".mp3,.flac,.wav,.m4a" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
        </div>
        <TrackList />
      </div>
    </main>
  );
}

function MusicPlayer() {
  const currentUser = useUserStore((state) => state.currentUser);
  const { playTrack, setTracks } = useAudioStore();
  const hasLoadedInitialState = useRef(false);

  // 1. Fetch all tracks. They are needed to find the track to play.
  const { data: allTracks, isSuccess: allTracksSuccess } = useQuery<Track[]>({
    queryKey: ['allTracks'],
    queryFn: async () => {
      return fetch('http://localhost:3000/tracks').then(res => res.json());
    },
    enabled: !!currentUser,
  });

  // 2. Fetch the last playback state. Enable it only when we have tracks to search.
  const { data: lastStateData, isSuccess: lastStateSuccess } = useQuery<{ trackId: string | null; position: number | null }>({
    queryKey: ['lastPlaybackState', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return { trackId: null, position: null };
      return fetch(`http://localhost:3000/users/${currentUser.id}/playback-state`).then(res => res.json());
    },
    enabled: allTracksSuccess, // Only run this query after we have the track list
  });

  // 3. Main effect to process all data and set the initial state once.
  useEffect(() => {
    // Gatekeeper to ensure this runs only once per component mount
    if (hasLoadedInitialState.current) return;

    // Wait until both queries are successful and have data
    if (allTracksSuccess && allTracks && lastStateSuccess && lastStateData) {
      setTracks(allTracks); // Set the full track list in the store

      if (lastStateData.trackId) {
        const lastPlayedTrack = allTracks.find(t => t.id === lastStateData.trackId);
        
        if (lastPlayedTrack) {
          // We found the track, load it into the player and mark initialization as complete
          playTrack(lastPlayedTrack, { startPaused: true, seekTo: lastStateData.position ?? 0 });
        }
      }
      hasLoadedInitialState.current = true;
    }
  }, [
    allTracks, allTracksSuccess,
    lastStateData, lastStateSuccess,
    setTracks, playTrack
  ]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      <PlayerBar />
    </div>
  );
}

function App() {
  const currentUser = useUserStore((state) => state.currentUser);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {currentUser ? <MusicPlayer /> : <AuthPage />}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
