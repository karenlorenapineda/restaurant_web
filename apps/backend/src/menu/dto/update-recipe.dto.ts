import { IsInt, IsArray, IsOptional, IsPositive, ValidateNested } from "class-validator";
import { CreateRecipeItemDto } from "./create-recipe-item.dto";
import { UpdateRecipeItemDto } from "./update-recipe-item.dto";
import { Type } from "class-transformer";

export class UpdateRecipeDto{
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateRecipeItemDto)
	@IsOptional()
	create?: CreateRecipeItemDto[];

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdateRecipeItemDto)
	@IsOptional()
	update?: UpdateRecipeItemDto[];

	@IsArray()
	@IsInt({ each: true })
	@IsPositive({ each: true })
	@IsOptional()
	delete?: number[];
}