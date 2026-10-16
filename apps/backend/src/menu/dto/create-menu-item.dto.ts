import {IsString, IsInt, IsNumber, IsBoolean, IsNotEmpty, IsOptional, IsPositive, IsArray, ValidateNested, MaxLength, Min, ArrayMinSize } from "class-validator";
import { Type } from "class-transformer";
import { CreateRecipeIngredientDto } from "../../recipes/dto/create-recipe-ingredient.dto";
export class CreateMenuItemDto {
	@IsString({	message: "name must be a string" })
	@IsNotEmpty({ message: "name is required" })
	@MaxLength(255, { message: "name must not exceed 255 characters" })
	name: string;

	@IsOptional()
	@IsString({ message: "description must be a string" })
	@IsNotEmpty({ message: "description is required" })
	description?: string;

	@IsNumber({ maxDecimalPlaces: 2 },{ message: "price must be a number with a maximum of 2 decimal places" })
	@Min(0, { message: "price cannot be negative." })
	price: number;

	@IsInt({ message: "categoryId must be an integer" })
	@IsPositive({ message: "categoryId must be greater than 0" })
	categoryId: number;

	@IsOptional()
	@IsString({ message: "imageUrl must be a string" })
	@IsNotEmpty({ message: "imageUrl is required" })
	imageUrl?: string;

	@IsOptional()
	@IsBoolean({ message: "isAvailable status must be a boolean" })
	isAvailable?: boolean;

	@IsOptional()
	@IsString({ message: "internalRecipe must be a string" })
	internalRecipe?: string;

	@IsOptional()
	@IsBoolean({ message: "isFavorite status must be a boolean" })
	isFavorite?: boolean;

	@IsOptional()
	@IsBoolean({ message: "showImageInGallery must be a boolean" })
	showImageInGallery?: boolean;

	@IsOptional()
	@IsArray({ message: "ingredients must be an array." })
	@ArrayMinSize(1, { message: "ingredients must contain at least one ingredient." })
	@ValidateNested({ each: true})
	@Type(() => CreateRecipeIngredientDto)
	ingredients?: CreateRecipeIngredientDto[];
}