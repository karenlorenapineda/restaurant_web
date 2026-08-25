import {IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateCategoryDto {
	@IsString({
		message: "Name must be a string",
	})
	@IsNotEmpty({
		message: "Name is required",
	})
	name: string;

	@IsString({
		message: "Description must be a string",
	})
	@IsOptional()
	description?: string;

}