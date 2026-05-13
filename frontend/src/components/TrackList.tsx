import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Pause, Disc, FolderInput, Loader2, Trash2 } from 'lucide-react';
import { useAudioStore, type Track } from '../store/useAudioStore';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';

export function TrackList() {

  const { activePlaylist, playTrack, currentTrack, isPlaying, togglePlay, searchTerm } = useAudioStore();

  const queryClient = useQueryClient();

  const [movingTrack, setMovingTrack] = useState<Track | null>(null);

  const [deletingTrack, setDeletingTrack] = useState<Track | null>(null);

  const [targetPlaylist, setTargetPlaylist] = useState<string>('');



  const { data: playlists } = useQuery<string[]>({

    queryKey: ['playlists'],

    queryFn: async () => {

      const res = await fetch('http://localhost:3000/playlists');

      return res.json();

    },

  });



  const moveMutation = useMutation({

    mutationFn: async ({ id, playlist }: { id: string; playlist: string | null }) => {

      const res = await fetch(`http://localhost:3000/tracks/${id}/move`, {

        method: 'PUT',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ targetPlaylist: playlist }),

      });

      if (!res.ok) throw new Error('Failed to move track');

      return res.json();

    },

    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: ['tracks'] });

      queryClient.invalidateQueries({ queryKey: ['playlists'] });

      setMovingTrack(null);

    }

  });



  const deleteMutation = useMutation({

    mutationFn: async (id: string) => {

      const res = await fetch(`http://localhost:3000/tracks/${id}`, {

        method: 'DELETE',

      });

      if (!res.ok) throw new Error('Failed to delete track');

      return;

    },

    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: ['tracks'] });

      queryClient.invalidateQueries({ queryKey: ['playlists'] });

      setDeletingTrack(null); // Close dialog

    },

  });



  const handleMoveSubmit = () => {

    if (movingTrack) {

      moveMutation.mutate({ 

        id: movingTrack.id, 

        playlist: targetPlaylist === 'all_tracks' ? null : targetPlaylist 

      });

    }

  };



  const { data: tracks, isLoading, isFetching } = useQuery<Track[]>({

    queryKey: ['tracks', activePlaylist, searchTerm],

    queryFn: async () => {

      const url = new URL('http://localhost:3000/tracks');

      if (activePlaylist) {

        url.searchParams.append('playlist', activePlaylist);

      }

      if (searchTerm) {

        url.searchParams.append('search', searchTerm);

      }

      const res = await fetch(url.toString());

      return res.json();

    },

  });



  if (isLoading) {

    return <div className="text-muted-foreground">Loading library...</div>;

  }



  if (!tracks || tracks.length === 0) {

    return (

      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">

        <Disc className="w-16 h-16 mb-4 opacity-20" />

        <p>

          {searchTerm 

            ? `No results for "${searchTerm}"` 

            : activePlaylist 

              ? `No tracks in ${activePlaylist}.` 

              : 'No tracks found. Sync your local folder.'

          }

        </p>

      </div>

    );

  }



  return (

    <div className={`w-full transition-opacity ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>

      <div className="grid grid-cols-[1fr_80px] md:grid-cols-[1fr_200px_80px_100px] gap-4 px-4 py-2 border-b border-border text-sm font-medium text-muted-foreground uppercase tracking-wider">

        <div>Title</div>

        <div className="hidden md:block">Album</div>
        <div className="hidden md:block">Year</div>
        <div className="text-right">Time</div>
      </div>
      <div className="mt-2 flex flex-col gap-1">
        {tracks.map((track) => {
          const isCurrent = currentTrack?.id === track.id;
          const minutes = Math.floor(track.duration / 60);
          const seconds = Math.floor(track.duration % 60).toString().padStart(2, '0');

          return (
            <div
              key={track.id}
              onClick={() => {
                if (isCurrent) togglePlay();
                else playTrack(track);
              }}
              className={`grid grid-cols-[1fr_80px] md:grid-cols-[1fr_200px_80px_100px] gap-4 px-4 py-3 rounded-lg cursor-pointer transition-colors group ${
                isCurrent ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'
              }`}
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-10 h-10 bg-secondary rounded flex-shrink-0 flex items-center justify-center relative overflow-hidden group-hover:bg-secondary/80">
                  {isCurrent && isPlaying ? (
                    <Pause className="w-5 h-5 text-primary" />
                  ) : (
                    <Play className={`w-5 h-5 ${isCurrent ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} fill="currentColor" />
                  )}
                </div>
                <div className="truncate">
                  <div className={`font-medium truncate ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                    {track.title}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{track.artist}</div>
                </div>
              </div>
              <div className="hidden md:flex items-center text-sm text-muted-foreground truncate">
                {track.album || 'Unknown Album'}
              </div>
              <div className="hidden md:flex items-center text-sm text-muted-foreground truncate">
                {track.year || '-'}
              </div>
              <div className="flex items-center justify-end text-sm text-muted-foreground gap-2 md:gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTargetPlaylist(track.playlist ?? 'all_tracks');
                    setMovingTrack(track);
                  }}
                  className="hover:text-foreground transition opacity-0 group-hover:opacity-100"
                  title="Move to another playlist"
                >
                  <FolderInput className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingTrack(track);
                  }}
                  className="hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                  title="Delete track"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <span>{minutes}:{seconds}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!movingTrack} onOpenChange={(open) => !open && setMovingTrack(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Move Track</DialogTitle>
            <DialogDescription>
              Select a new playlist for <span className="font-semibold text-foreground">{movingTrack?.title}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={targetPlaylist} onValueChange={(val) => setTargetPlaylist(val || 'all_tracks')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a playlist" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_tracks">-- No Playlist (All Tracks) --</SelectItem>
                {playlists?.map(p => (
                  <SelectItem key={p} value={p} className="cursor-pointer">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMovingTrack(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleMoveSubmit}
              disabled={moveMutation.isPending}
            >
              {moveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FolderInput className="w-4 h-4 mr-2" />}
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingTrack} onOpenChange={(open) => !open && setDeletingTrack(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete
              <span className="font-semibold text-foreground"> {deletingTrack?.title}</span> from your library
              and remove the audio file from your server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setDeletingTrack(null)}>Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => deletingTrack && deleteMutation.mutate(deletingTrack.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
