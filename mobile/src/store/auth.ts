import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  hotel_id: string;
  hotel_name?: string;
  avatar_url?: string;
}

interface AuthState {
  session: any | null;
  profile: Profile | null;
  loading: boolean;
  setSession: (session: any | null) => void;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  loading: true,
  setSession: (session) => set({ session, loading: false }),
  setProfile: (profile) => set({ profile }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
}));
