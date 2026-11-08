import { useRef, useState } from "react";

import { uploadFile } from "../../api/files";
import { t } from "../../i18n";

interface Props {
  canEdit: boolean;
  image: string | undefined;
  onChange: (url: string) => void;
}

export function DishImageUploader({ canEdit, image, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadFile(file);
      onChange(uploaded.url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("No se pudo subir la imagen."),
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-3 rounded-sm border border-white/10 bg-zinc-950/60 p-4">
      <p className="text-sm font-semibold text-zinc-200">
        {t("Subir imagen del plato")}
      </p>

      {image ? (
        <img
          alt=""
          className="h-40 w-40 rounded-sm border border-white/10 object-cover"
          src={image}
        />
      ) : (
        <p className="text-sm text-zinc-500">{t("Sin imagen asignada")}</p>
      )}

      {canEdit ? (
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="text-sm text-zinc-300 file:mr-3 file:rounded-sm file:border-0 file:bg-[#e8b45f] file:px-3 file:py-2 file:font-bold file:text-zinc-950 disabled:opacity-50"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
            type="file"
          />
          {uploading ? (
            <span className="text-sm text-[#e8b45f]">{t("Subiendo...")}</span>
          ) : null}
          {image ? (
            <button
              className="rounded-sm border border-red-900 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-900"
              onClick={() => onChange("")}
              type="button"
            >
              {t("Quitar imagen")}
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
