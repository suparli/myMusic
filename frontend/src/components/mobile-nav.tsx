import { useState } from "react"
import { Menu, Music, Home, ListMusic, Library } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useAudioStore } from "@/store/useAudioStore"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { ModeToggle } from "./mode-toggle"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { activePlaylist, setActivePlaylist } = useAudioStore()

  const { data: playlists } = useQuery<string[]>({
    queryKey: ['playlists'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/playlists')
      return res.json()
    }
  })

  return (
    <div className="flex items-center justify-between p-4 md:hidden border-b border-border bg-background">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          <Music className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">Antigravity</span>
      </div>

      <div className="flex items-center gap-2">
        <ModeToggle />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 focus-visible:ring-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-background border-r-border w-72 flex flex-col p-0 pt-10">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto px-4 pb-4">
              <nav className="flex flex-col gap-1">
                <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Library</p>
                <Button 
                  variant="ghost" 
                  className={`justify-start gap-3 px-2 ${activePlaylist === null ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
                  onClick={() => { setActivePlaylist(null); setOpen(false); }}
                >
                  <Home className="w-4 h-4" /> All Tracks
                </Button>
                
                <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2 flex items-center gap-2">
                  <ListMusic className="w-4 h-4" /> Playlists
                </p>
                {playlists?.map((playlist) => (
                  <Button 
                    key={playlist}
                    variant="ghost" 
                    className={`justify-start gap-3 px-2 ${activePlaylist === playlist ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
                    onClick={() => { setActivePlaylist(playlist); setOpen(false); }}
                  >
                    <Library className="w-4 h-4" />
                    <span className="truncate flex-1 text-left">{playlist}</span>
                  </Button>
                ))}
                {playlists?.length === 0 && (
                  <p className="px-2 text-sm text-muted-foreground italic">No playlists found.</p>
                )}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
