import {IsString, IsInt, IsNumber, IsBoolean, IsNotEmpty, IsOptional, IsPositive, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CreateRecipeItemDto } from "./create-recipe-item.dto";
export class CreateMenuItemDto {
	@IsString({
		message: "Name must be a string",
	})
	@IsNotEmpty({
		message: "Name is required",
	})
	name: string;

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
	price: number;

	@IsInt({
		message: "Category ID must be an integer",
	})
	@IsPositive({
		message: "Category ID must be greater than 0",
	})
	categoryId: number;

	@IsString({
		message: "Image URL must be a string",
	})
	@IsOptional()
	imageUrl?: string;

	@IsBoolean({
		message: "Availability status must be a boolean",
	})
	isAvailable: boolean;

	@IsString({
		message: "Internal recipe must be a string",
	})
	@IsOptional()
	internalRecipe?: string;

	@IsBoolean({
		message: "Favorite status must be a boolean",
	})
	isFavorite: boolean;

		@IsBoolean({
		message: "Show image in gallery must be a boolean",
	})
	showImageInGallery: boolean;

	@IsArray()
	@ValidateNested({ each: true})
	@Type(() => CreateRecipeItemDto)
	@IsOptional()
	recipe?: CreateRecipeItemDto[];
}