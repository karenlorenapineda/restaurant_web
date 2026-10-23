import { type DragEvent, useEffect, useRef, useState } from "react";

import {
  ACCEPT_ATTRIBUTE,
  formatBytes,
  MAX_FILE_SIZE_BYTES,
  validateFile,
} from "./fileRules";
import { FilePreview } from "./FilePreview";
import {
  deleteFile,
  fileUrl,
  listFiles,
  type StoredFile,
  uploadFile,
} from "./filesApi";

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function FileManager() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    listFiles(controller.signal)
      .then(setFiles)
      .catch((loadError: unknown) => {
        if (!(loadError instanceof DOMException && loadError.name === "AbortError")) {
          setError(messageOf(loadError, "Could not load your files"));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  async function handleSelection(selected: FileList | null) {
    if (!selected || selected.length === 0) {
      return;
    }

    setError(null);

    for (const file of Array.from(selected)) {
      const problem = validateFile(file);

      if (problem) {
        setError(`${file.name}: ${problem}`);
        continue;
      }

      try {
        setProgress(0);
        const stored = await uploadFile(file, setProgress);
        setFiles((current) => [stored, ...current]);
      } catch (uploadError) {
        setError(`${file.name}: ${messageOf(uploadError, "Upload failed")}`);
      } finally {
        setProgress(null);
      }
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleDelete(file: StoredFile) {
    if (!window.confirm(`Delete "${file.originalName}"?`)) {
      return;
    }

    try {
      await deleteFile(file.id);
      setFiles((current) => current.filter((item) => item.id !== file.id));
    } catch (deleteError) {
      setError(messageOf(deleteError, "Could not delete the file"));
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    void handleSelection(event.dataTransfer.files);
  }

  const uploading = progress !== null;

  return (
    <section aria-labelledby="files-title" className="mt-10">
      <h2 className="font-display text-2xl font-bold" id="files-title">
        Files
      </h2>

      <label
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragging
            ? "border-picasso-terracotta bg-picasso-terracotta/10"
            : "border-black/20 bg-white"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDrop={handleDrop}
      >
        <span className="font-medium">
          Drop files here or click to choose
        </span>
        <span className="text-sm text-black/60">
          PNG, JPEG, GIF, WebP or PDF · up to {formatBytes(MAX_FILE_SIZE_BYTES)}
        </span>
        <input
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          disabled={uploading}
          multiple
          onChange={(event) => void handleSelection(event.target.files)}
          ref={inputRef}
          type="file"
        />
      </label>

      {uploading && (
        <div className="mt-4">
          <div
            aria-label="Upload progress"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="h-3 overflow-hidden rounded-full bg-black/10"
            role="progressbar"
          >
            <div
              className="h-full bg-picasso-olive transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-sm text-black/60">Uploading… {progress}%</p>
        </div>
      )}

      {error && (
        <p
          className="mt-4 rounded-xl border border-picasso-terracotta/40 bg-picasso-terracotta/10 p-3 text-sm"
          role="alert"
        >
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-black/60">Loading files…</p>
      ) : files.length === 0 ? (
        <p className="mt-6 text-black/60">You have not uploaded any files yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {files.map((file) => (
            <li
              className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-3"
              key={file.id}
            >
              <FilePreview file={file} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{file.originalName}</p>
                <p className="text-sm text-black/60">
                  {formatBytes(file.size)} ·{" "}
                  {new Date(file.createdAt).toLocaleString()}
                </p>
              </div>
              <a
                className="text-sm font-semibold text-picasso-olive hover:underline"
                href={fileUrl(file.id)}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open
              </a>
              <a
                className="text-sm font-semibold text-picasso-olive hover:underline"
                href={fileUrl(file.id, true)}
              >
                Download
              </a>
              <button
                className="text-sm font-semibold text-picasso-terracotta hover:underline"
                onClick={() => void handleDelete(file)}
                type="button"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
