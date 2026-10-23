-- CreateTable
CREATE TABLE "files" (
    "file_id" UUID NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "stored_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("file_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "files_stored_name_key" ON "files"("stored_name");

-- CreateIndex
CREATE INDEX "files_owner_id_idx" ON "files"("owner_id");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Usuarios"("UsuarioID") ON DELETE CASCADE ON UPDATE CASCADE;
