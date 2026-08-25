-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "internal_recipe" TEXT,
ADD COLUMN     "is_favorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "show_image_in_gallery" BOOLEAN NOT NULL DEFAULT false;
