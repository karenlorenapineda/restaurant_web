import { join } from "node:path";

// Inside the container the process runs from /app, so this is /app/uploads
// (the Docker volume). In local dev it is apps/backend/uploads (gitignored).
export const UPLOAD_DIRECTORY = join(process.cwd(), "uploads");

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_USER = 50;

export const ALLOWED_FILE_TYPES = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
} as const;

export type AllowedMimeType = keyof typeof ALLOWED_FILE_TYPES;
