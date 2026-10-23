import { fileUrl, type StoredFile } from "./filesApi";

export function FilePreview({ file }: { file: StoredFile }) {
  if (file.mimeType.startsWith("image/")) {
    return (
      <img
        alt={file.originalName}
        className="h-16 w-16 shrink-0 rounded-xl border border-black/10 object-cover"
        loading="lazy"
        src={fileUrl(file.id)}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-picasso-cream text-sm font-bold text-picasso-terracotta"
    >
      PDF
    </div>
  );
}
