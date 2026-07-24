import { useRef, useState, type KeyboardEvent } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface Props {
  accept?: string;
  onFile: (f: File) => void | Promise<void>;
  loading?: boolean;
}

export function FileUploader({ accept = ".doc,.docx,.pdf", onFile, loading }: Props) {
  const { t } = useI18n();
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files || !files[0]) return;
    onFile(files[0]);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => ref.current?.click()}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ref.current?.click(); }
      }}
      role="button"
      tabIndex={0}
      aria-label={t("documents.upload_hint")}
      className={cn(
        "group relative bg-surface-raised rounded-2xl px-8 py-12 text-center cursor-pointer transition shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        drag ? "ring-2 ring-accent/40 bg-accent-50/40" : "hover:shadow-raised",
        loading && "opacity-60 pointer-events-none",
      )}
    >
      <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-accent-50 flex items-center justify-center text-accent transition group-hover:scale-105">
        <UploadCloud size={22} strokeWidth={1.75} />
      </div>
      <p className="font-medium text-ink">{t("documents.upload_hint")}</p>
      <p className="text-sm text-ink-muted mt-1.5">{t("documents.upload_meta")}</p>
      <input ref={ref} type="file" accept={accept} className="hidden"
             onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}
