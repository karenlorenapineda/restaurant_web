import { Transform, Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export const MAX_NAME_LENGTH = 30;
export const MAX_NOTES_LENGTH = 140;
export const MAX_QUANTITY = 20;
export const CODE_PATTERN = /^[A-Z0-9]{6}$/;

const cleanText = ({ value }: { value: unknown }) =>
  typeof value === "string"
    ? // eslint-disable-next-line no-control-regex
      value
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : value;

const upper = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

export class CreateSharedOrderDto {
  @Transform(cleanText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_NAME_LENGTH)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  tableId!: number;
}

export class JoinSharedOrderDto {
  @Transform(upper)
  @Matches(CODE_PATTERN, { message: "code must be 6 letters or digits" })
  code!: string;

  @Transform(cleanText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_NAME_LENGTH)
  name!: string;

  /** Present when the participant is reconnecting. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  token?: string;
}

export class AddItemDto {
  @IsInt()
  @IsPositive()
  itemId!: number;

  @IsInt()
  @Min(1)
  @Max(MAX_QUANTITY)
  quantity!: number;

  @IsOptional()
  @Transform(cleanText)
  @IsString()
  @MaxLength(MAX_NOTES_LENGTH)
  notes?: string;
}

export class SetQuantityDto {
  @IsInt()
  @IsPositive()
  lineId!: number;

  @IsInt()
  @Min(1)
  @Max(MAX_QUANTITY)
  quantity!: number;
}

export class SetNotesDto {
  @IsInt()
  @IsPositive()
  lineId!: number;

  @Transform(cleanText)
  @IsString()
  @MaxLength(MAX_NOTES_LENGTH)
  notes!: string;
}

export class RemoveLineDto {
  @IsInt()
  @IsPositive()
  lineId!: number;
}
