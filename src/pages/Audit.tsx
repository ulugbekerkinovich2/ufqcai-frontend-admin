import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { api } from "@/api/client";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/lib/toast";

interface Row {
  id: number; user_id?: string; action: string; entity: string;
  entity_id?: string; meta?: any; created_at: string;
}

const ACTION_KEY: Record<string, string> = {
  login: "audit.act.login",
  create_user: "audit.act.create_user",
  update_user: "audit.act.update_user",
  change_password: "audit.act.change_password",
  create_criterion: "audit.act.create_criterion",
  update_criterion: "audit.act.update_criterion",
  delete_criterion: "audit.act.delete_criterion",
  upload_document: "audit.act.upload_document",
  delete_document: "audit.act.delete_document",
  restore_document: "audit.act.restore_document",
  upload_law: "audit.act.upload_law",
  delete_user: "audit.act.delete_user",
  enable_2fa: "audit.act.enable_2fa",
  disable_2fa: "audit.act.disable_2fa",
};

export function Audit() {
  const { t } = useI18n();
  const { data: items = [] } = useQuery({
    queryKey: ["audit"],
    queryFn: async () => (await api.get<Row[]>("/audit")).data,
  });

  async function exportCsv() {
    try {
      const res = await api.get("/audit/export.csv", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "audit-log.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">{t("audit.section")}</p>
          <h1 className="font-serif text-[26px] leading-tight">{t("audit.title")}</h1>
          <p className="text-[13.5px] text-ink-muted mt-2">{t("audit.hint")}</p>
        </div>
        <button onClick={exportCsv} className="btn-secondary h-9 shrink-0">
          <Download size={15} strokeWidth={1.75} /> {t("audit.export")}
        </button>
      </header>

      <div className="card overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <h2 className="font-serif text-lg">{t("audit.recent")}</h2>
          <span className="text-[12px] text-ink-muted">{items.length}</span>
        </div>
        <ul className="surface-divider divide-y divide-ink/[0.05]">
          {items.map((r) => {
            const key = ACTION_KEY[r.action];
            const label = key ? t(key) : r.action;
            return (
              <li key={r.id} className="px-6 py-4 hover:bg-surface-sunken/40 transition">
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-ink">{label === key ? r.action : label}</div>
                    <div className="text-[12px] text-ink-muted mt-0.5 flex items-center gap-2">
                      <span className="font-mono tabular-nums">{r.user_id?.slice(0, 8) || "—"}</span>
                      <span>·</span>
                      <span>{r.entity}</span>
                      {r.meta && Object.keys(r.meta).length > 0 && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-[11px] text-ink-subtle">{JSON.stringify(r.meta)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-[12.5px] text-ink-muted tabular-nums shrink-0">{formatDate(r.created_at)}</div>
                </div>
              </li>
            );
          })}
          {items.length === 0 && (
            <li className="px-6 py-12 text-center text-ink-muted text-sm">{t("audit.empty")}</li>
          )}
        </ul>
      </div>
    </div>
  );
}
