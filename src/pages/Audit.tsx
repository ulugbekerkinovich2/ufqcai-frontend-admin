import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { formatDate } from "@/lib/utils";

interface Row {
  id: number; user_id?: string; action: string; entity: string;
  entity_id?: string; meta?: any; created_at: string;
}

const ACTION_LABEL: Record<string, string> = {
  login: "Tizimga kirish",
  create_user: "Foydalanuvchi yaratish",
  update_user: "Foydalanuvchi o'zgartirish",
  change_password: "Parolni o'zgartirish",
  create_criterion: "Mezon yaratish",
  update_criterion: "Mezon o'zgartirish",
  delete_criterion: "Mezon o'chirish",
  upload_document: "Ssenariy yuklash",
  delete_document: "Ssenariy o'chirish",
  upload_law: "Qonun yuklash",
};

export function Audit() {
  const { data: items = [] } = useQuery({
    queryKey: ["audit"],
    queryFn: async () => (await api.get<Row[]>("/audit")).data,
  });

  return (
    <div className="space-y-7 animate-fade-in">
      <header>
        <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-muted mb-2">Xavfsizlik</p>
        <h1 className="font-serif text-[26px] leading-tight">Audit jurnali</h1>
        <p className="text-[13.5px] text-ink-muted mt-2">Tizimda bajarilgan barcha muhim harakatlar.</p>
      </header>

      <div className="card overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <h2 className="font-serif text-lg">So'nggi voqealar</h2>
          <span className="text-[12px] text-ink-muted">{items.length} ta yozuv</span>
        </div>
        <ul className="surface-divider divide-y divide-ink/[0.05]">
          {items.map((r) => (
            <li key={r.id} className="px-6 py-4 hover:bg-surface-sunken/40 transition">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-ink">
                    {ACTION_LABEL[r.action] || r.action}
                  </div>
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
          ))}
          {items.length === 0 && (
            <li className="px-6 py-12 text-center text-ink-muted text-sm">Audit yozuvlari yo'q</li>
          )}
        </ul>
      </div>
    </div>
  );
}
