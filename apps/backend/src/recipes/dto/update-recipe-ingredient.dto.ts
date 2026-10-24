import { IsInt, IsNumber, IsOptional, IsPositive, Min } from "class-validator";

export class UpdateRecipeIngredientDto {
	@IsInt({ message: "id must be an integer." })
	@IsPositive({ message: "id must be greater than 0." })
	id: number;

	@IsOptional()
	@IsInt({ message: "ingredientId must be an integer." })
	@IsPositive({ message: "ingredientId must be greater than 0." })
	ingredientId?: number;
	
	@IsOptional()
	@IsNumber({maxDecimalPlaces: 3},{ message: "quantity must be a number with a maximum of 3 decimal places." })
	@Min(0, { message: "quantity cannot be negative."})
	quantity?: number;

	@IsOptional()
	@IsInt({ message: "unitId must be an integer." })
	@IsPositive({ message: "unitId must be greater than 0." })
	unitId?: number;
}