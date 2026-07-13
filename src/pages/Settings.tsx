import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useI18n } from "@/lib/i18n";
import { SlidersHorizontal, Check, Coins, Bot, Wallet, RefreshCw, AlertCircle, Cpu } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface BalanceResp {
  available: number | null;
  used: number | null;
  granted: number | null;
  expires_at: number | null;
  error: string | null;
}

interface Setting { key: string; value: string; }

const STRICTNESS_LEVELS = [
  { v: 1, labelKey: "settings.level_1", descKey: "settings.level_1_desc", color: "text-risk-low-fg bg-risk-low-bg border-risk-low-dot" },
  { v: 2, labelKey: "settings.level_2", descKey: "settings.level_2_desc", color: "text-risk-medium-fg bg-risk-medium-bg border-risk-medium-dot" },
  { v: 3, labelKey: "settings.level_3", descKey: "settings.level_3_desc", color: "text-risk-high-fg bg-risk-high-bg border-risk-high-dot" },
];

interface ModelInfo {
  id: string;
  label: string;
  input: number;   // $ per 1M
  output: number;  // $ per 1M
  note?: string;
}

const MODEL_GROUPS: { catKey: string; color: string; models: ModelInfo[] }[] = [
  {
    catKey: "settings.model_cat_cheap",
    color: "text-risk-low-fg bg-risk-low-bg border-risk-low-dot",
    models: [
      { id: "gpt-5-nano",    label: "GPT-5 Nano",    input: 0.05,  output: 0.40 },
      { id: "gpt-4o-mini",   label: "GPT-4o Mini",   input: 0.15,  output: 0.60 },
      { id: "gpt-5-mini",    label: "GPT-5 Mini",    input: 0.25,  output: 2.00 },
      { id: "gpt-4.1-mini",  label: "GPT-4.1 Mini",  input: 0.40,  output: 1.60 },
    ],
  },
  {
    catKey: "settings.model_cat_mid",
    color: "text-risk-medium-fg bg-risk-medium-bg border-risk-medium-dot",
    models: [
      { id: "gpt-5.5",  label: "GPT-5.5",  input: 1.25, output: 10.00 },
      { id: "gpt-5",    label: "GPT-5",    input: 1.25, output: 10.00 },
      { id: "gpt-4.1",  label: "GPT-4.1",  input: 2.00, output: 8.00  },
      { id: "gpt-4o",   label: "GPT-4o",   input: 2.50, output: 10.00, note: "default" },
    ],
  },
  {
    catKey: "settings.model_cat_premium",
    color: "text-risk-high-fg bg-risk-high-bg border-risk-high-dot",
    models: [
      { id: "o4-mini",      label: "o4-mini",      input: 1.10,  output: 4.40  },
      { id: "o3-mini",      label: "o3-mini",      input: 1.10,  output: 4.40  },
      { id: "o3",           label: "o3",           input: 2.00,  output: 8.00  },
      { id: "gpt-5.5-pro",  label: "GPT-5.5 Pro",  input: 15.00, output: 60.00 },
    ],
  },
];

function blended(input: number, output: number) {
  return (input * 0.7 + output * 0.3).toFixed(2);
}

function findModel(id: string): ModelInfo | undefined {
  for (const g of MODEL_GROUPS) {
    const m = g.models.find((m) => m.id === id);
    if (m) return m;
  }
}

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

  const modelSetting = settingsList?.find((s) => s.key === "openai_model");
  const currentModel = modelSetting?.value ?? "gpt-4o";
  const currentModelInfo = findModel(currentModel);

  const providerSetting = settingsList?.find((s) => s.key === "llm_provider");
  const currentProvider = providerSetting?.value ?? "openai";

  const balanceQ = useQuery<BalanceResp>({
    queryKey: ["openai-balance"],
    queryFn: async () => (await api.get<BalanceResp>("/usage/openai-balance")).data,
    staleTime: 60_000,
    retry: false,
  });

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  const mut = useMutation({
    mutationFn: async (v: number) =>
      (await api.put(`/settings/analysis_strictness`, { value: String(v) })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); flash(); toast.success(t("settings.saved")); },
    onError: () => toast.error(t("common.error")),
  });

  const tokenMut = useMutation({
    mutationFn: async (v: string) =>
      (await api.put(`/settings/per_user_daily_tokens`, { value: v })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); setTokenInput(""); flash(); toast.success(t("settings.saved")); },
    onError: () => toast.error(t("common.error")),
  });

  const modelMut = useMutation({
    mutationFn: async (v: string) =>
      (await api.put(`/settings/openai_model`, { value: v })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); flash(); toast.success(t("settings.saved")); },
    onError: () => toast.error(t("common.error")),
  });

  const providerMut = useMutation({
    mutationFn: async (v: string) =>
      (await api.put(`/settings/llm_provider`, { value: v })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); flash(); toast.success(t("settings.saved")); },
    onError: () => toast.error(t("common.error")),
  });

  return (
    <div className="space-y-7 animate-fade-in">
      <header>
        <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("settings.section")}</p>
        <h1 className="font-serif text-[24px] leading-tight">{t("settings.title")}</h1>
      </header>

      {/* AI Provider */}
      <div className="card p-8 max-w-2xl">
        <div className="flex items-start gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-accent-50 text-accent grid place-items-center shrink-0">
            <Cpu size={18} />
          </div>
          <div>
            <h2 className="font-serif text-lg">{t("settings.provider")}</h2>
            <p className="text-[13px] text-ink-muted mt-0.5">{t("settings.provider_hint")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: "openai", label: t("settings.provider_openai"), desc: t("settings.provider_openai_desc"), Icon: Bot },
            { v: "qwen", label: t("settings.provider_qwen"), desc: t("settings.provider_qwen_desc"), Icon: Cpu },
          ].map(({ v, label, desc, Icon }) => {
            const active = currentProvider === v;
            return (
              <button
                key={v}
                onClick={() => providerMut.mutate(v)}
                disabled={providerMut.isPending}
                className={cn(
                  "text-left p-4 rounded-xl border-2 transition",
                  active ? "text-accent bg-accent-50 border-accent" : "bg-surface border-ink/[0.08] hover:border-ink/20",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon size={16} />
                    <span className="font-medium text-[14.5px]">{label}</span>
                  </div>
                  {active && <Check size={16} className="shrink-0" />}
                </div>
                <div className={cn("text-[12.5px] mt-1", active ? "opacity-80" : "text-ink-muted")}>{desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* OpenAI Balance */}
      {currentProvider === "openai" && (
      <div className="card p-8 max-w-2xl">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent-50 text-accent grid place-items-center shrink-0">
              <Wallet size={18} />
            </div>
            <div>
              <h2 className="font-serif text-lg">{t("settings.balance")}</h2>
              <p className="text-[13px] text-ink-muted mt-0.5">{t("settings.balance_hint")}</p>
            </div>
          </div>
          <button
            onClick={() => balanceQ.refetch()}
            disabled={balanceQ.isFetching}
            className="h-8 w-8 rounded-lg border border-ink/10 grid place-items-center text-ink-muted hover:text-ink hover:border-ink/20 transition shrink-0"
          >
            <RefreshCw size={14} className={balanceQ.isFetching ? "animate-spin" : ""} />
          </button>
        </div>

        {balanceQ.isLoading ? (
          <div className="text-[13px] text-ink-muted">{t("common.loading")}</div>
        ) : balanceQ.data?.error ? (
          <div className="flex items-center gap-2 text-[13px] text-risk-high-fg">
            <AlertCircle size={14} />
            {t("settings.balance_error")}: <span className="font-mono text-[12px]">{balanceQ.data.error}</span>
          </div>
        ) : balanceQ.data ? (
          <div className="grid grid-cols-3 gap-3">
            {[
              { labelKey: "settings.balance_available", value: balanceQ.data.available, highlight: true },
              { labelKey: "settings.balance_used",      value: balanceQ.data.used,      highlight: false },
              { labelKey: "settings.balance_granted",   value: balanceQ.data.granted,   highlight: false },
            ].map(({ labelKey, value, highlight }) => (
              <div key={labelKey} className={cn(
                "rounded-xl p-4 border",
                highlight ? "bg-accent-50/40 border-accent/20" : "bg-surface-sunken border-transparent"
              )}>
                <div className="text-[11.5px] text-ink-muted mb-1">{t(labelKey)}</div>
                <div className={cn("font-mono font-bold text-[20px] tabular-nums", highlight ? "text-accent" : "text-ink")}>
                  {value != null ? `$${Number(value).toFixed(2)}` : "—"}
                </div>
              </div>
            ))}
            {balanceQ.data.expires_at && (
              <div className="col-span-3 text-[12px] text-ink-subtle">
                {t("settings.balance_expires")}: {new Date(balanceQ.data.expires_at * 1000).toLocaleDateString()}
              </div>
            )}
          </div>
        ) : null}
      </div>
      )}

      {/* Strictness */}
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
                  active ? `${lvl.color} border-current` : "bg-surface border-ink/[0.08] hover:border-ink/20",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className={cn("font-medium text-[14.5px]", active ? "" : "text-ink")}>{t(lvl.labelKey)}</div>
                    <div className={cn("text-[12.5px] mt-0.5", active ? "opacity-80" : "text-ink-muted")}>{t(lvl.descKey)}</div>
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

      {/* AI Model */}
      {currentProvider === "openai" ? (
      <div className="card p-8 max-w-2xl">
        <div className="flex items-start gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-accent-50 text-accent grid place-items-center shrink-0">
            <Bot size={18} />
          </div>
          <div>
            <h2 className="font-serif text-lg">{t("settings.model")}</h2>
            <p className="text-[13px] text-ink-muted mt-0.5">{t("settings.model_hint")}</p>
          </div>
        </div>

        {/* Current model info bar */}
        {currentModelInfo && (
          <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-surface-sunken text-[13px]">
            <span className="text-ink-muted">{t("settings.model_current")}:</span>
            <span className="font-mono font-semibold text-ink">{currentModelInfo.label}</span>
            <span className="text-ink-subtle">·</span>
            <span className="text-ink-muted">{t("settings.model_blended")}:</span>
            <span className="font-mono text-accent font-semibold">${blended(currentModelInfo.input, currentModelInfo.output)}/1M</span>
          </div>
        )}

        <div className="space-y-5">
          {MODEL_GROUPS.map((grp) => (
            <div key={grp.catKey}>
              <div className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-medium border mb-2.5", grp.color)}>
                {t(grp.catKey)}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {grp.models.map((m) => {
                  const active = currentModel === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => modelMut.mutate(m.id)}
                      disabled={modelMut.isPending}
                      className={cn(
                        "text-left p-3 rounded-xl border-2 transition group",
                        active
                          ? `${grp.color} border-current`
                          : "bg-surface border-ink/[0.08] hover:border-ink/20",
                      )}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <div className={cn("font-mono font-semibold text-[13px]", active ? "" : "text-ink")}>
                            {m.label}
                            {m.note === "default" && (
                              <span className="ml-1.5 text-[10px] font-sans font-normal opacity-60">default</span>
                            )}
                          </div>
                          <div className={cn("text-[11.5px] mt-0.5 tabular-nums", active ? "opacity-75" : "text-ink-muted")}>
                            in ${m.input} · out ${m.output}
                          </div>
                          <div className={cn("text-[11px] mt-0.5 tabular-nums font-medium", active ? "opacity-90" : "text-ink-subtle")}>
                            ≈ ${blended(m.input, m.output)}/1M blended
                          </div>
                        </div>
                        {active && <Check size={15} className="shrink-0 mt-0.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      ) : (
      <div className="card p-8 max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent-50 text-accent grid place-items-center shrink-0">
            <Cpu size={18} />
          </div>
          <div>
            <h2 className="font-serif text-lg">{t("settings.provider_qwen")}</h2>
            <p className="text-[13px] text-ink-muted mt-0.5">{t("settings.provider_qwen_desc")}</p>
          </div>
        </div>
      </div>
      )}

      {/* Token limit */}
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
            <div className="text-[12px] text-ink-muted mb-1.5">
              {t("settings.token_current")}: <span className="font-mono font-semibold text-ink">{Number(tokenCurrent).toLocaleString()}</span>
            </div>
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
