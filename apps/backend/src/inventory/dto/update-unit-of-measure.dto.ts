import { UnitType } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateUnitOfMeasureDto{
	@IsString({
		message: "Abbreviation must be a string.",
	})
	@IsNotEmpty({
		message: "Abbreviation cannot be empty.",
	})
	@IsOptional()
	abbreviation?: string;
  
	@IsString({
		message: "Name must be a string.",
	})
	@IsNotEmpty({
		message: "Name cannot be empty.",
	})
	@IsOptional()
	name?: string;

	@IsEnum(UnitType, {
		message: "Type must be one of: weight, volume, count.",
	})
	@IsOptional()
	type?: UnitType;
}