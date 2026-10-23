import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import type { StoredFile } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { PrismaService } from "../database/prisma.service";
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

function toResponse(file: StoredFile): FileResponse {
  return {
    id: file.id,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    createdAt: file.createdAt,
    url: `/api/files/${file.id}/content`,
  };
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
  constructor(private readonly prisma: PrismaService) {}

  async upload(
    ownerId: number,
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

    const storedCount = await this.prisma.storedFile.count({
      where: { ownerId },
    });

    if (storedCount >= MAX_FILES_PER_USER) {
      throw new ForbiddenException(
        `File limit reached (${MAX_FILES_PER_USER}). Delete a file first`,
      );
    }

    const id = randomUUID();
    const storedName = `${id}${ALLOWED_FILE_TYPES[mimeType]}`;
    const diskPath = join(UPLOAD_DIRECTORY, storedName);

    await mkdir(UPLOAD_DIRECTORY, { recursive: true });
    await writeFile(diskPath, file.buffer, { flag: "wx" });

    try {
      const created = await this.prisma.storedFile.create({
        data: {
          id,
          ownerId,
          originalName: normalizeOriginalName(file.originalname),
          storedName,
          mimeType,
          size: file.buffer.length,
        },
      });

      return toResponse(created);
    } catch (error) {
      await unlink(diskPath).catch(() => undefined);
      throw error;
    }
  }

  async list(ownerId: number): Promise<FileResponse[]> {
    const files = await this.prisma.storedFile.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    });

    return files.map(toResponse);
  }

  async get(ownerId: number, id: string): Promise<FileResponse> {
    return toResponse(await this.findOwned(ownerId, id));
  }

  async openContent(ownerId: number, id: string) {
    const file = await this.findOwned(ownerId, id);
    const diskPath = join(UPLOAD_DIRECTORY, file.storedName);

    try {
      await access(diskPath);
    } catch {
      throw new NotFoundException("File not found");
    }

    return { file, stream: createReadStream(diskPath) };
  }

  async remove(ownerId: number, id: string): Promise<void> {
    const file = await this.findOwned(ownerId, id);

    await this.prisma.storedFile.delete({ where: { id: file.id } });
    await unlink(join(UPLOAD_DIRECTORY, file.storedName)).catch(
      () => undefined,
    );
  }

  // Files owned by someone else are reported as missing, not forbidden,
  // so ids cannot be probed.
  private async findOwned(ownerId: number, id: string): Promise<StoredFile> {
    const file = await this.prisma.storedFile.findFirst({
      where: { id, ownerId },
    });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    return file;
  }
}
