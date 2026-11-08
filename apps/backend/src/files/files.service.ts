import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  mkdir,
  readFile,
  readdir,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";

import { detectMimeType } from "./file-signature";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILES_PER_USER,
  UPLOAD_DIRECTORY,
} from "./files.constants";

export interface FileResponse {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  url: string;
}

interface FileMetadata {
  originalName: string;
  mimeType: string;
  createdAt: string;
}

const METADATA_SUFFIX = ".meta.json";

function metadataPath(id: string): string {
  return join(UPLOAD_DIRECTORY, `${id}${METADATA_SUFFIX}`);
}

async function readMetadata(id: string): Promise<FileMetadata | null> {
  try {
    const raw = await readFile(metadataPath(id), "utf8");
    return JSON.parse(raw) as FileMetadata;
  } catch {
    return null;
  }
}

async function writeMetadata(
  id: string,
  metadata: FileMetadata,
): Promise<void> {
  await writeFile(metadataPath(id), JSON.stringify(metadata), "utf8");
}

// Multer decodes multipart filenames as latin1; restore UTF-8 and strip any
// path or control characters. The name is only metadata, never a disk path.
function normalizeOriginalName(name: string): string {
  const decoded = Buffer.from(name, "latin1").toString("utf8");
  const baseName = decoded.split(/[\\/]/).pop() ?? "";
  const cleaned = baseName
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 255);

  return cleaned.length > 0 ? cleaned : "file";
}

@Injectable()
export class FilesService {
  // `ownerId` is accepted to keep the controller signature stable, but it is
  // ignored until authentication is merged. Files are stored on disk with a
  // sidecar JSON; the `files` table is not used.
  async upload(
    _ownerId: number | undefined,
    file: Express.Multer.File | undefined,
  ): Promise<FileResponse> {
    if (!file || file.size === 0) {
      throw new BadRequestException(
        "A non-empty file is required in the 'file' field",
      );
    }

    const mimeType = detectMimeType(file.buffer);

    if (!mimeType) {
      throw new UnsupportedMediaTypeException(
        "Only PNG, JPEG, GIF, WebP and PDF files are allowed",
      );
    }

    await mkdir(UPLOAD_DIRECTORY, { recursive: true });

    const existing = await this.listAll();
    if (existing.length >= MAX_FILES_PER_USER) {
      throw new ForbiddenException(
        `File limit reached (${MAX_FILES_PER_USER}). Delete a file first`,
      );
    }

    const id = randomUUID();
    const storedName = `${id}${ALLOWED_FILE_TYPES[mimeType]}`;
    const diskPath = join(UPLOAD_DIRECTORY, storedName);

    await writeFile(diskPath, file.buffer, { flag: "wx" });

    const createdAt = new Date().toISOString();
    const originalName = normalizeOriginalName(file.originalname);

    await writeMetadata(id, { originalName, mimeType, createdAt });

    return {
      id,
      originalName,
      mimeType,
      size: file.buffer.length,
      createdAt: new Date(createdAt),
      url: `/api/files/${id}/content`,
    };
  }

  async list(_ownerId: number | undefined): Promise<FileResponse[]> {
    return this.listAll();
  }

  private async listAll(): Promise<FileResponse[]> {
    let entries: string[];

    try {
      entries = await readdir(UPLOAD_DIRECTORY);
    } catch {
      return [];
    }

    const results: FileResponse[] = [];

    for (const entry of entries) {
      if (entry.endsWith(METADATA_SUFFIX)) continue;

      const id = entry.split(".")[0];
      if (!id) continue;

      const metadata = await readMetadata(id);
      if (!metadata) continue;

      const fileStat = await stat(join(UPLOAD_DIRECTORY, entry)).catch(
        () => null,
      );
      if (!fileStat) continue;

      results.push({
        id,
        originalName: metadata.originalName,
        mimeType: metadata.mimeType,
        size: fileStat.size,
        createdAt: new Date(metadata.createdAt),
        url: `/api/files/${id}/content`,
      });
    }

    return results.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async get(
    _ownerId: number | undefined,
    id: string,
  ): Promise<FileResponse> {
    const metadata = await readMetadata(id);
    if (!metadata) throw new NotFoundException("File not found");

    const storedName = await this.findStoredName(id);
    if (!storedName) throw new NotFoundException("File not found");

    const fileStat = await stat(join(UPLOAD_DIRECTORY, storedName)).catch(
      () => null,
    );
    if (!fileStat) throw new NotFoundException("File not found");

    return {
      id,
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
      size: fileStat.size,
      createdAt: new Date(metadata.createdAt),
      url: `/api/files/${id}/content`,
    };
  }

  async openContent(_ownerId: number | undefined, id: string) {
    const file = await this.get(_ownerId, id);
    const storedName = await this.findStoredName(id);
    if (!storedName) throw new NotFoundException("File not found");

    return {
      file,
      stream: createReadStream(join(UPLOAD_DIRECTORY, storedName)),
    };
  }

  async remove(
    _ownerId: number | undefined,
    id: string,
  ): Promise<void> {
    const storedName = await this.findStoredName(id);
    if (!storedName) throw new NotFoundException("File not found");

    await unlink(join(UPLOAD_DIRECTORY, storedName)).catch(() => undefined);
    await unlink(metadataPath(id)).catch(() => undefined);
  }

  private async findStoredName(id: string): Promise<string | null> {
    let entries: string[];

    try {
      entries = await readdir(UPLOAD_DIRECTORY);
    } catch {
      return null;
    }

    for (const entry of entries) {
      if (entry.endsWith(METADATA_SUFFIX)) continue;
      if (entry.startsWith(`${id}.`)) return entry;
    }

    return null;
  }
}
