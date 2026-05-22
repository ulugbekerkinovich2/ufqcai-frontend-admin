import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/api/client";
import { useAuth } from "@/store/auth";

export interface StreamState {
  id?: string;
  status?: "pending" | "running" | "completed" | "failed";
  error_message?: string | null;
  overall_score?: number | null;
  overall_risk?: string | null;
}

/**
 * SSE orqali tahlil holatini real-time kuzatish.
 * Auth qo'llanmasa fetch'ga header qo'shib bo'lmaydi, shuning uchun token query'da uzatamiz.
 * Backend SSE endpoint Bearer header bilan ham ishlaydi — bu yerda fetch+reader ishlatamiz.
 */
export function useAnalysisStream(analysisId: string | undefined): StreamState {
  const [state, setState] = useState<StreamState>({});
  const { accessToken } = useAuth();

  useEffect(() => {
    if (!analysisId || !accessToken) return;
    const ctrl = new AbortController();

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/analyses/${analysisId}/events`, {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: "text/event-stream" },
          signal: ctrl.signal,
        });
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";
          for (const evt of events) {
            const dataLine = evt.split("\n").find((l) => l.startsWith("data:"));
            if (!dataLine) continue;
            try {
              const payload = JSON.parse(dataLine.slice(5).trim());
              setState(payload);
              if (payload.status === "completed" || payload.status === "failed") {
                ctrl.abort();
                return;
              }
            } catch {}
          }
        }
      } catch {}
    })();

    return () => ctrl.abort();
  }, [analysisId, accessToken]);

  return state;
}
