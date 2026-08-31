import { Type } from "class-transformer";
import { IsArray, ArrayMinSize, IsInt, IsPositive, ValidateNested } from "class-validator";
import { CreateRecipeIngredientDto } from "./create-recipe-ingredient.dto";

export class CreateRecipeDto {
	@IsInt({ message: "itemId must be an integer." })
	@IsPositive({ message: "itemId must be greater than 0." })
	itemId: number;

	@IsArray({ message: "ingredients must be an array." })
	@ArrayMinSize(1, { message: "ingredients must contain at least one ingredient." })
	@ValidateNested({each: true})
	@Type(() => CreateRecipeIngredientDto)
	ingredients: CreateRecipeIngredientDto[];
}