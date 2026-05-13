import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// This is the user object without the password
export interface User {
  id: string;
  username: string;
  lastPlayedTrackId: string | null;
  lastPlayedPosition: number | null;
}

interface UserState {
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: null,
      login: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),
    }),
    {
      name: 'user-storage', // unique name
      storage: createJSONStorage(() => localStorage), // use local storage
    }
  )
);
