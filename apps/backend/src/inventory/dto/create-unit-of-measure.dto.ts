import { UnitType } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export class CreateUnitOfMeasureDto {
	@IsString({
		message: "Abbreviation must be a string.",
	})
	@IsNotEmpty({
		message: "Abbreviation cannot be empty.",
	})
	abbreviation: string;
  
	@IsString({
		message: "Name must be a string.",
	})
	@IsNotEmpty({
		message: "Name cannot be empty.",
	})
	name: string;

	@IsEnum(UnitType, {
		message: "Type must be one of: weight, volume, count.",
	})
	type: UnitType;
}