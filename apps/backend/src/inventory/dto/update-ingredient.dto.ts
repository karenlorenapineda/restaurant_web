import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from "class-validator";

export class UpdateIngredientDto {
	@IsString({
		message: "Name must be a string.",
	})
	@IsNotEmpty({
		message: "Name cannot be empty."
	})
	@IsOptional()
	name?: string;

	@IsInt({
		message: "Unit ID must be an integer.",
	})
	@IsPositive({
		message: "Unit ID must be greater than 0."
	})
	@IsOptional()
	unitId?: number;

	@IsNumber({ maxDecimalPlaces: 2 }, {
		message: "Unit cost must be a number.",
	})
	@IsPositive({
		message: "Unit cost must be greater than 0.",
	})
	@IsOptional()
	unitCost?: number;

	@IsNumber({ maxDecimalPlaces: 3 }, {
		message: "Current stock must be a number.",
	})
	@Min(0, {
		message: "Current stock cannot be negative.",
	})
	@IsOptional()
	currentStock?: number;

	@IsNumber({ maxDecimalPlaces: 3 }, {
		message: "Minimum stock must be a number.",
	})
	@Min(0, {
		message: "Minimum stock cannot be negative.",
	})
	@IsOptional()
	minimumStock?: number;
}