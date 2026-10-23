import type { AllowedMimeType } from "./files.constants";

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/**
 * Detects the real type of a file from its first bytes.
 * Returns null when the content is not one of the allowed types.
 */
export function detectMimeType(buffer: Buffer): AllowedMimeType | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return "image/png";
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  const header = buffer.subarray(0, 12).toString("latin1");

  if (header.startsWith("GIF87a") || header.startsWith("GIF89a")) {
    return "image/gif";
  }

  if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP") {
    return "image/webp";
  }

  if (header.startsWith("%PDF-")) {
    return "application/pdf";
  }

  return null;
}
