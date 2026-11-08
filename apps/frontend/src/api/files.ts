export interface UploadedFile {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export async function fetchFiles(
  signal?: AbortSignal,
): Promise<UploadedFile[]> {
  const response = await fetch("/api/files", {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error("Files request failed");
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("Invalid files response");
  return data as UploadedFile[];
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/files", { method: "POST", body });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Upload failed");
  }
  return (await response.json()) as UploadedFile;
}

export async function deleteFile(id: number): Promise<void> {
  const response = await fetch(`/api/files/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Delete failed");
}
