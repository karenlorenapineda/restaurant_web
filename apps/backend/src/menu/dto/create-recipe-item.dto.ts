import { IsInt, IsNumber, IsPositive } from "class-validator";

export class CreateRecipeItemDto{
	@IsInt({
		message: "Ingredient ID must be an integer",
	})
	@IsPositive({
		message: "Ingredient ID must be greater than 0",
	})
	ingredientId: number;

	@IsNumber({ maxDecimalPlaces: 3 }, {
		message: "Quantity must be a number with a maximum of 3 decimal places",
	})
	@IsPositive({
		message: "Quantity must be greater than 0",
	})
	quantity: number;
}