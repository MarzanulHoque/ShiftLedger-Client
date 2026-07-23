import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { decodeAccessToken } from '../lib/jwt';
import type { Role } from '../api/types';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  departmentId: string | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setSession: (accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, user: decodeAccessToken(accessToken) }),
      clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'shiftledger-auth' },
  ),
);
