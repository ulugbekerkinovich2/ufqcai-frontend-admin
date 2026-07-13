import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  permissions: string[];
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setTokens: (a: string, r: string) => void;
  setUser: (u: User | null) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (a, r) => set({ accessToken: a, refreshToken: r }),
      setUser: (u) => set({ user: u }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: "senariy-analizer-auth",
      // Refresh token httpOnly cookie'da yashaydi — localStorage'ga YOZILMAYDI (XSS himoyasi).
      // Faqat qisqa umrli access token va user profili saqlanadi.
      partialize: (s) => ({ accessToken: s.accessToken, user: s.user }),
    },
  ),
);
