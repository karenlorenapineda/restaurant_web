export interface StoredFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  url: string;
}

const FILES_ENDPOINT = "/api/files";

function extractMessage(raw: string, status: number): string {
  try {
    const body = JSON.parse(raw) as { message?: string | string[] };
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message;

    if (message) {
      return message;
    }
  } catch {
    // Not JSON: fall through to the generic message.
  }

  return status === 413
    ? "The file is too large"
    : `Request failed (${status})`;
}

// Assumes cookie-based sessions. If authentication ends up using a Bearer
// token instead, this is the place to adapt (and previews would need to be
// fetched as blobs with the header).
export function fileUrl(id: string, download = false): string {
  return `${FILES_ENDPOINT}/${id}/content${download ? "?download=1" : ""}`;
}

export async function listFiles(signal?: AbortSignal): Promise<StoredFile[]> {
  const response = await fetch(FILES_ENDPOINT, {
    credentials: "include",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(extractMessage(await response.text(), response.status));
  }

  const body: unknown = await response.json();

  if (!Array.isArray(body)) {
    throw new Error("Unexpected response from the server");
  }

  return body as StoredFile[];
}

// XMLHttpRequest is used because fetch cannot report upload progress.
export function uploadFile(
  file: File,
  onProgress: (percent: number) => void,
): Promise<StoredFile> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);

    request.open("POST", FILES_ENDPOINT);
    request.withCredentials = true;
    request.setRequestHeader("Accept", "application/json");

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(JSON.parse(request.responseText) as StoredFile);
      } else {
        reject(new Error(extractMessage(request.responseText, request.status)));
      }
    };
    request.onerror = () => reject(new Error("Network error during upload"));
    request.onabort = () => reject(new Error("Upload cancelled"));

    request.send(form);
  });
}

export async function deleteFile(id: string): Promise<void> {
  const response = await fetch(`${FILES_ENDPOINT}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(extractMessage(await response.text(), response.status));
  }
}
