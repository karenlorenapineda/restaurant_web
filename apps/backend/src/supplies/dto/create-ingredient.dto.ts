import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class CreateIngredientDto {
	@IsString({ message: "name must be a string." })
	@IsNotEmpty({ message: "name cannot be empty." })
	@MaxLength(255, {message: "name must not exceed 255 characters" })
	name: string;

	@IsInt({ message: "unitId must be an integer." })
	@IsPositive({ message: "unitId must be greater than 0." })
	unitId: number;

	@IsNumber({ maxDecimalPlaces: 2 }, { message: "unitCost cost must be a number.", })
	@Min(0, { message: "unitCost cannot be negative." })
	unitCost: number;

	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 3 }, { message: "currentStock must be a number." })
	@Min(0, { message: "currentStock cannot be negative." })
	currentStock?: number;

	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 3 }, { message: "minimumStock must be a number." })
	@Min(0, { message: "minimumStock cannot be negative." })
	minimumStock?: number;
}