import {IsString, IsOptional } from "class-validator";

export class UpdateCategoryDto {
	@IsString({
		message: "Name must be a string",
	})
	@IsOptional()
	name?: string;

	@IsString({
		message: "Description must be a string",
	})
	@IsOptional()
	description?: string;
}