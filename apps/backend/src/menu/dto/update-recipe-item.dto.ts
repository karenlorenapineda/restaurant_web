import { IsInt, IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateRecipeItemDto{
	@IsInt({
		message: "Recipe ID must be an integer",
	})
	@IsPositive({
		message: "Recipe ID must be greater than 0",
	})
	recipeId: number;

	@IsInt({
		message: "Ingredient ID must be an integer",
	})
	@IsPositive({
		message: "Ingredient ID must be greater than 0",
	})
	@IsOptional()
	ingredientId?: number;

	@IsNumber({ maxDecimalPlaces: 3 }, {
		message: "Quantity must be a number with a maximum of 3 decimal places",
	})
	@IsPositive({
		message: "Quantity must be greater than 0",
	})
	@IsOptional()
	quantity?: number;

	@IsInt({
		message: "Unit ID must be an integer",
	})
	@IsPositive({
		message: "Unit ID must be greater than 0",
	})
	@IsOptional()
	unitId?: number;
}