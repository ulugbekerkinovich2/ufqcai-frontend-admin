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
  user: User | null;
  setTokens: (a: string) => void;
  setUser: (u: User | null) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setTokens: (a) => set({ accessToken: a }),
      setUser: (u) => set({ user: u }),
      logout: () => set({ accessToken: null, user: null }),
    }),
    {
      name: "senariy-analizer-auth",
      // Refresh token faqat httpOnly cookie'da yashaydi — backend endi uni JSON javobda
      // ham qaytarmaydi, shu sabab bu yerda saqlash/state'da tutish shart emas (XSS himoyasi).
      partialize: (s) => ({ accessToken: s.accessToken, user: s.user }),
    },
  ),
);
