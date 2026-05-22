import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  accept?: string;
  onFile: (f: File) => void | Promise<void>;
  loading?: boolean;
}

export function FileUploader({ accept = ".doc,.docx,.pdf", onFile, loading }: Props) {
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
      className={cn(
        "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition",
        drag ? "border-brand bg-brand/5" : "border-gray-300 hover:border-brand",
        loading && "opacity-60 pointer-events-none",
      )}
    >
      <Upload className="mx-auto mb-3 h-8 w-8 text-gray-400" />
      <p className="font-medium">Faylni shu yerga torting yoki tanlash uchun bosing</p>
      <p className="text-sm text-gray-500 mt-1">.doc, .docx, .pdf — maks. 25MB</p>
      <input ref={ref} type="file" accept={accept} className="hidden"
             onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}
