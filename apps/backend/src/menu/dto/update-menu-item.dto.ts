import { IsString, IsInt, IsNumber, IsBoolean, IsNotEmpty, IsOptional, IsPositive, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { UpdateRecipeDto } from "./update-recipe.dto";
export class UpdateMenuItemDto {
	@IsString({
		message: "Name must be a string",
	})
	@IsNotEmpty({
		message: "Name is required",
	})
	@IsOptional()
	name?: string;

	@IsString({
		message: "Description must be a string",
	})
	@IsOptional()
	description?: string;

	@IsNumber({ maxDecimalPlaces: 2 },
	{
		message: "Price must be a number with a maximum of 2 decimal places",
	})
	@IsPositive({
		message: "Price must be greater than 0",
	})
	@IsOptional()
	price?: number;

	@IsInt({
		message: "Category ID must be an integer",
	})
	@IsPositive({
		message: "Category ID must be greater than 0",
	})
	@IsOptional()
	categoryId?: number;

	@IsString({
		message: "Image URL must be a string",
	})
	@IsOptional()
	imageUrl?: string;

	@IsBoolean({
		message: "Availability status must be a boolean",
	})
	@IsOptional()
	isAvailable?: boolean;

	@IsString({
		message: "Internal recipe must be a string",
	})
	@IsOptional()
	internalRecipe?: string;

	@IsBoolean({
		message: "Favorite status must be a boolean",
	})
	@IsOptional()
	isFavorite?: boolean;

	@IsBoolean({
		message: "Show image in gallery must be a boolean",
	})
	@IsOptional()
	showImageInGallery?: boolean;

	@ValidateNested()
	@Type(() => UpdateRecipeDto)
	@IsOptional()
	recipe?: UpdateRecipeDto;
}