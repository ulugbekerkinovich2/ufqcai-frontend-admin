import axios from "axios";
import { useAuth } from "@/store/auth";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/+$/, "");

export const API_BASE_URL = API_BASE;

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  const { refreshToken, setTokens, logout } = useAuth.getState();
  if (!refreshToken) throw new Error("no refresh");
  try {
    const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken });
    setTokens(data.access_token, data.refresh_token);
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
    if (error.response?.status === 401 && !original._retry) {
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
    return Promise.reject(error);
  },
);
