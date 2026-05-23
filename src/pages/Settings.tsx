import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useI18n } from "@/lib/i18n";
import { SlidersHorizontal, Check, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface Setting { key: string; value: string; }

const STRICTNESS_LEVELS = [
  { v: 1, labelKey: "settings.level_1", descKey: "settings.level_1_desc", color: "text-risk-low-fg bg-risk-low-bg border-risk-low-dot" },
  { v: 2, labelKey: "settings.level_2", descKey: "settings.level_2_desc", color: "text-risk-medium-fg bg-risk-medium-bg border-risk-medium-dot" },
  { v: 3, labelKey: "settings.level_3", descKey: "settings.level_3_desc", color: "text-risk-high-fg bg-risk-high-bg border-risk-high-dot" },
];

export function Settings() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: settingsList } = useQuery<Setting[]>({
    queryKey: ["admin-settings"],
    queryFn: async () => (await api.get<Setting[]>("/settings")).data,
  });

  const current = settingsList?.find((s) => s.key === "analysis_strictness");
  const currentVal = Number(current?.value ?? 2);

  const tokenSetting = settingsList?.find((s) => s.key === "per_user_daily_tokens");
  const [tokenInput, setTokenInput] = useState<string>("");
  const tokenCurrent = tokenSetting?.value ?? "300000";

  const mut = useMutation({
    mutationFn: async (v: number) =>
      (await api.put(`/settings/analysis_strictness`, { value: String(v) })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const tokenMut = useMutation({
    mutationFn: async (v: string) =>
      (await api.put(`/settings/per_user_daily_tokens`, { value: v })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      setTokenInput("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <div className="space-y-7 animate-fade-in">
      <header>
        <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("settings.section")}</p>
        <h1 className="font-serif text-[24px] leading-tight">{t("settings.title")}</h1>
      </header>

      <div className="card p-8 max-w-2xl">
        <div className="flex items-start gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-accent-50 text-accent grid place-items-center shrink-0">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h2 className="font-serif text-lg">{t("settings.strictness")}</h2>
            <p className="text-[13px] text-ink-muted mt-0.5">{t("settings.strictness_hint")}</p>
          </div>
        </div>

        <div className="space-y-3">
          {STRICTNESS_LEVELS.map((lvl) => {
            const active = currentVal === lvl.v;
            return (
              <button
                key={lvl.v}
                onClick={() => mut.mutate(lvl.v)}
                disabled={mut.isPending}
                className={cn(
                  "w-full text-left p-4 rounded-xl border-2 transition",
                  active
                    ? `${lvl.color} border-current`
                    : "bg-surface border-ink/[0.08] hover:border-ink/20",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className={cn("font-medium text-[14.5px]", active ? "" : "text-ink")}>
                      {t(lvl.labelKey)}
                    </div>
                    <div className={cn("text-[12.5px] mt-0.5", active ? "opacity-80" : "text-ink-muted")}>
                      {t(lvl.descKey)}
                    </div>
                  </div>
                  {active && <Check size={18} className="shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>

        {saved && (
          <div className="mt-4 flex items-center gap-2 text-[13px] text-risk-low-fg animate-fade-in">
            <Check size={15} /> {t("settings.saved")}
          </div>
        )}
      </div>

      <div className="card p-8 max-w-2xl">
        <div className="flex items-start gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-accent-50 text-accent grid place-items-center shrink-0">
            <Coins size={18} />
          </div>
          <div>
            <h2 className="font-serif text-lg">{t("settings.token_limit")}</h2>
            <p className="text-[13px] text-ink-muted mt-0.5">{t("settings.token_limit_hint")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-[12px] text-ink-muted mb-1.5">{t("settings.token_current")}: <span className="font-mono font-semibold text-ink">{Number(tokenCurrent).toLocaleString()}</span></div>
            <input
              type="number"
              min={0}
              step={50000}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder={tokenCurrent}
              className="input w-full font-mono"
            />
            <div className="text-[11.5px] text-ink-subtle mt-1.5">{t("settings.token_zero_hint")}</div>
          </div>
          <button
            className="btn-primary shrink-0 self-start mt-6"
            disabled={!tokenInput || tokenMut.isPending}
            onClick={() => tokenMut.mutate(tokenInput)}
          >
            <Check size={15} /> {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
