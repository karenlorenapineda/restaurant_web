import { IsInt, IsNumber, IsPositive, Min } from "class-validator";

export class CreateRecipeIngredientDto {
	@IsInt({ message: "ingredientId must be an integer." })
	@IsPositive({ message: "ingredientId must be greater than 0." })
	ingredientId: number;

	@IsNumber({maxDecimalPlaces: 3},{ message: "quantity must be a number with a maximum of 3 decimal places." })
	@Min(0, { message: "quantity cannot be negative."})
	quantity: number;

	@IsInt({ message: "unitId must be an integer." })
	@IsPositive({ message: "unitId must be greater than 0." })
	unitId: number;
}