import { create } from 'zustand';
import type { User } from '../types/auth';
import { queryClient } from '../services/queryClient';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  setSession: (accessToken: string, user: User) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setSession: (accessToken, user) => {
    queryClient.clear();
    set({ accessToken, user });
  },
  clearSession: () => {
    queryClient.clear();
    set({ accessToken: null, user: null });
  },
}));
