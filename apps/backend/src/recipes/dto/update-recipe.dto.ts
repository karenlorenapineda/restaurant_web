import { Type } from "class-transformer";
import { IsArray, ArrayMinSize, ValidateNested } from "class-validator";
import { UpdateRecipeIngredientDto } from "./update-recipe-ingredient.dto";

export class UpdateRecipeDto {
	@IsArray({ message: "ingredients must be an array." })
	@ArrayMinSize(1, { message: "ingredients must contain at least one ingredient." })
	@ValidateNested({each: true})
	@Type(() => UpdateRecipeIngredientDto)
	ingredients: UpdateRecipeIngredientDto[];
}