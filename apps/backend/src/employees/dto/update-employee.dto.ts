import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from "class-validator";

export class UpdateEmployeeDto{
  @IsOptional()
  @IsString({ message: 'firstName must be a string' })
  @IsNotEmpty({ message: 'firstName is required' })
  @MaxLength(255, { message: 'firstName must not exceed 255 characters' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'lastName must be a string' })
  @IsNotEmpty({ message: 'lastName is required' })
  @MaxLength(255, { message: 'lastName must not exceed 255 characters' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'phone must be a string' })
  @IsNotEmpty({ message: 'phone must not be empty' })
  @MaxLength(255, { message: 'phone must not exceed 255 characters' })
  phone?: string;

  @IsOptional()
  @IsInt({ message: 'positionId must be an integer' })
  @IsPositive({ message: 'positionId must be greater than 0' })
  positionId?: number;

  @IsOptional()
  @IsDateString({}, { message: 'birthDate must be a valid date' })
  birthDate?: string;

}
