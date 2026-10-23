import {
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { MAX_FILE_SIZE_BYTES } from "./files.constants";
import { FilesService } from "./files.service";
import { OwnerId } from "./owner-id.decorator";

// RFC 5987 encoding for non-ASCII names in Content-Disposition.
function encodeFilename(name: string): string {
  return encodeURIComponent(name).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

// TODO (after merging authentication): add @UseGuards(<auth guard>) here,
// unless the auth branch registers a global guard.
@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  // No `storage` option => multer keeps the upload in memory, which lets the
  // service check the magic bytes before anything touches the disk.
  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
    }),
  )
  upload(
    @OwnerId() ownerId: number,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.filesService.upload(ownerId, file);
  }

  @Get()
  list(@OwnerId() ownerId: number) {
    return this.filesService.list(ownerId);
  }

  @Get(":id")
  get(
    @OwnerId() ownerId: number,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.filesService.get(ownerId, id);
  }

  @Get(":id/content")
  @Header("Cache-Control", "private, no-store")
  async content(
    @OwnerId() ownerId: number,
    @Param("id", ParseUUIDPipe) id: string,
    @Query("download") download?: string,
  ): Promise<StreamableFile> {
    const { file, stream } = await this.filesService.openContent(ownerId, id);
    const disposition = download === "1" ? "attachment" : "inline";

    return new StreamableFile(stream, {
      type: file.mimeType,
      length: file.size,
      disposition: `${disposition}; filename*=UTF-8''${encodeFilename(file.originalName)}`,
    });
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(
    @OwnerId() ownerId: number,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.filesService.remove(ownerId, id);
  }
}
