import { IsArray, ArrayMinSize, IsInt, IsPositive } from "class-validator";
import { Type } from "class-transformer";

export class DeleteRecipeDto {
	@IsArray({ message: "ids must be an array." })
 	@ArrayMinSize(1, { message: 'ids must contain at least one id.' })
	@IsInt({ each: true, message: "each id must be an integer." })
  	@IsPositive({ each: true, message: "each id must be greater than 0." })
  	@Type(() => Number)
	ids: number[];
}