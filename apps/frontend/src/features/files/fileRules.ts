export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
] as const;

export const ACCEPT_ATTRIBUTE = ALLOWED_MIME_TYPES.join(",");

export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${unitIndex === 0 ? value : value.toFixed(1)} ${units[unitIndex]}`;
}

export function validateFile(file: File): string | null {
  if (file.size === 0) {
    return "The file is empty";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `The file exceeds ${formatBytes(MAX_FILE_SIZE_BYTES)}`;
  }

  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Only PNG, JPEG, GIF, WebP and PDF files are allowed";
  }

  return null;
}
