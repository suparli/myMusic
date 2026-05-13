import { Home, Library, ListMusic, Music, Edit2, RefreshCw, Loader2, Trash2, Search, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from './ui/button';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAudioStore } from '../store/useAudioStore';
import { useUserStore, type User } from '../store/useUserStore';
import { ModeToggle } from './mode-toggle';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';

export function Sidebar() {
  const queryClient = useQueryClient();
  const { activePlaylist, setActivePlaylist, searchTerm, setSearchTerm } = useAudioStore();
  const currentUser = useUserStore((state) => state.currentUser);
  const login = useUserStore((state) => state.login);
  const logout = useUserStore((state) => state.logout);
  
  const [renamingPlaylist, setRenamingPlaylist] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [deletingPlaylist, setDeletingPlaylist] = useState<string | null>(null);

  // Profile editing state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileUsername, setProfileUsername] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setProfileUsername(currentUser.username);
    }
  }, [currentUser, isProfileOpen]);

  const profileMutation = useMutation({
    mutationFn: async (data: { username: string; password?: string }) => {
      if (!currentUser) return;
      const res = await fetch(`http://localhost:3000/users/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update profile');
      }
      return res.json();
    },
    onSuccess: (updatedUser: User) => {
      login(updatedUser);
      setIsProfileOpen(false);
      setProfilePassword('');
      setProfileError(null);
    },
    onError: (err: Error) => {
      setProfileError(err.message);
    }
  });

  const handleProfileSubmit = () => {
    setProfileError(null);
    if (!profileUsername.trim()) {
      setProfileError("Username is required");
      return;
    }
    const data: any = { username: profileUsername.trim() };
    if (profilePassword.trim()) {
      data.password = profilePassword.trim();
    }
    profileMutation.mutate(data);
  };

  const { data: playlists } = useQuery<string[]>({
    queryKey: ['playlists'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/playlists');
      return res.json();
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('http://localhost:3000/scanner/sync', { method: 'POST' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string, newName: string }) => {
      const res = await fetch(`http://localhost:3000/playlists/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName })
      });
      return res.json();
    },
    onSuccess: (_, { oldName, newName }) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      if (activePlaylist === oldName) {
        setActivePlaylist(newName);
      }
      setRenamingPlaylist(null);
    }
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistName: string) => {
      const res = await fetch('http://localhost:3000/scanner/playlists', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistName }),
      });
      if (!res.ok) throw new Error('Failed to delete playlist');
      return;
    },
    onSuccess: (_, playlistName) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      if (activePlaylist === playlistName) {
        setActivePlaylist(null);
      }
      setDeletingPlaylist(null);
    }
  });

  const handleRenameClick = (e: React.MouseEvent, oldName: string) => {
    e.stopPropagation();
    setRenamingPlaylist(oldName);
    setNewPlaylistName(oldName);
  };

  const handleRenameSubmit = () => {
    if (renamingPlaylist && newPlaylistName && newPlaylistName.trim() !== '' && newPlaylistName !== renamingPlaylist) {
      renameMutation.mutate({ oldName: renamingPlaylist, newName: newPlaylistName.trim() });
    } else {
      setRenamingPlaylist(null);
    }
  };

  return (
    <aside className="w-64 hidden md:flex flex-col h-full bg-background border-r border-border pt-6 px-4">
      <div className="flex items-center justify-between px-2 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Music className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Antigravity</span>
        </div>
        <span className="flex items-center gap-2">
          <ModeToggle />
        </span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search songs..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-4">
        <nav className="flex flex-col gap-1">
          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Library</p>
          <Button 
            variant="ghost" 
            className={`justify-start gap-3 px-2 ${activePlaylist === null ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
            onClick={() => setActivePlaylist(null)}
          >
            <Home className="w-4 h-4" /> All Tracks
          </Button>
          
          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2 flex items-center gap-2">
            <ListMusic className="w-4 h-4" /> Playlists
          </p>
          {playlists?.map((playlist) => (
            <div key={playlist} className="flex items-center group">
              <Button 
                variant="ghost" 
                className={`flex-1 justify-start gap-3 px-2 ${activePlaylist === playlist ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
                onClick={() => setActivePlaylist(playlist)}
              >
                <Library className="w-4 h-4" />
                <span className="truncate flex-1 text-left">{playlist}</span>
              </Button>
              <button 
                className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-foreground transition-opacity"
                onClick={(e) => handleRenameClick(e, playlist)}
                title="Rename Playlist"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button 
                className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-red-500 transition-opacity"
                onClick={(e) => { e.stopPropagation(); setDeletingPlaylist(playlist); }}
                title="Delete Playlist"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {playlists?.length === 0 && (
            <p className="px-2 text-sm text-muted-foreground italic">No playlists found. Create folders in your library.</p>
          )}
        </nav>
      </div>

      <div className="mt-auto mb-4 flex flex-col gap-2 pt-4 border-t border-border">
        <Button 
          variant="outline" 
          className="justify-start gap-3 border-border hover:bg-secondary"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} /> 
          {syncMutation.isPending ? 'Syncing...' : 'Sync Local Folder'}
        </Button>
        <Button 
          variant="outline" 
          className="justify-start gap-3 border-border hover:bg-secondary"
          onClick={() => setIsProfileOpen(true)}
        >
          <UserIcon className="w-4 h-4" /> 
          User Profile
        </Button>
        <Button 
          variant="outline" 
          className="justify-start gap-3 border-border text-red-500/80 hover:bg-red-500/10 hover:text-red-500"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" /> 
          Logout
        </Button>
      </div>
      
      <Dialog open={!!renamingPlaylist} onOpenChange={(open) => !open && setRenamingPlaylist(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Playlist</DialogTitle>
            <DialogDescription>
              Enter a new name for the playlist "{renamingPlaylist}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingPlaylist(null)}>Cancel</Button>
            <Button onClick={handleRenameSubmit} disabled={renameMutation.isPending}>
              {renameMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPlaylist} onOpenChange={(open) => !open && setDeletingPlaylist(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the playlist 
              <span className="font-semibold text-foreground"> "{deletingPlaylist}"</span>, 
              including all tracks inside it, from your drive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setDeletingPlaylist(null)}>Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                variant="destructive" 
                onClick={() => deletingPlaylist && deletePlaylistMutation.mutate(deletingPlaylist)}
                disabled={deletePlaylistMutation.isPending}
              >
                {deletePlaylistMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete Playlist
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>
              Update your account credentials here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="profile-username">Username</Label>
              <Input
                id="profile-username"
                value={profileUsername}
                onChange={(e) => setProfileUsername(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-password">New Password (leave blank to keep current)</Label>
              <Input
                id="profile-password"
                type="password"
                placeholder="••••••••"
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
              />
            </div>
            {profileError && <p className="text-sm text-destructive font-medium">{profileError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileOpen(false)}>Cancel</Button>
            <Button onClick={handleProfileSubmit} disabled={profileMutation.isPending}>
              {profileMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
