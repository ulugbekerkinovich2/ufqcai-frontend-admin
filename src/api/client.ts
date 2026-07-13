import axios from "axios";
import { useAuth } from "@/store/auth";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/+$/, "");

export const API_BASE_URL = API_BASE;

// withCredentials: refresh token httpOnly cookie'sini yuborish/qabul qilish uchun.
export const api = axios.create({ baseURL: API_BASE, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  const { setTokens, logout } = useAuth.getState();
  try {
    // Refresh token httpOnly cookie'da — body yubormaymiz, withCredentials cookie'ni jo'natadi.
    const { data } = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
    setTokens(data.access_token, "");
    return data.access_token;
  } catch (e) {
    logout();
    throw e;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    const status: number | undefined = error.response?.status;

    // Token refresh
    if (status === 401 && !original._retry) {
      original._retry = true;
      try {
        refreshing = refreshing || doRefresh();
        const token = await refreshing;
        refreshing = null;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        window.location.href = "/login";
        return Promise.reject(e);
      }
    }

    // Network / server down — show toast (skip auth endpoints to avoid noise)
    const isAuthCall = original?.url?.includes("/auth/");
    if (!isAuthCall) {
      if (!error.response) {
        // No response = network error / server down
        import("@/lib/toast").then(({ toast }) =>
          toast.error("Server bilan bog'lanib bo'lmadi. Internetni tekshiring.")
        );
      } else if (status === 503 || status === 502 || status === 504) {
        import("@/lib/toast").then(({ toast }) =>
          toast.error("Server vaqtincha ishlamayapti. Biroz kutib qayta urinib ko'ring.")
        );
      } else if (status === 429) {
        import("@/lib/toast").then(({ toast }) =>
          toast.error("Juda ko'p so'rov yuborildi. Biroz kuting.")
        );
      }
    }

    return Promise.reject(error);
  },
);
