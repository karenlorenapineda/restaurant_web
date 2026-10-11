import { IsEnum, IsArray, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Min, ValidateNested } from "class-validator";
import { OrderType } from "@prisma/client";
import { Type } from "class-transformer";

export class CreateOrderModificationDto {
	@IsInt({ message: "Recipe ID must be an integer." })
	@IsPositive({ message: "Recipe ID must be a positive number." })
	recipeId: number;
}

class CreateOrderDetailDto {
	@IsInt({ message: "Item ID must be an integer." })
	@IsPositive({ message: "Item ID must be a positive number." })
	itemId: number;

	@IsInt({ message: "Quantity must be an integer." })
	@Min(1, { message: "Quantity must be at least 1." })
	quantity: number;

	@IsOptional()
	@IsString({ message: "Notes must be a string." })
	notes?: string;

	@IsOptional()
	@IsArray({ message: "Modifications must be an array." })
	@ValidateNested({ each: true, message: "Each modification must be valid." })
	@Type(() => CreateOrderModificationDto)
	modifications?: CreateOrderModificationDto[];
}

export class CreateOrderDto {
	@IsEnum(OrderType, { message: "Order type must be one of the following values: dine_in, takeaway, delivery.", })
	type: OrderType;

	@IsOptional()
	@IsInt({ message: "Table ID must be an integer." })
	@IsPositive({ message: "Table ID must be a positive number." })
	tableId?: number;

	@IsOptional()
	@IsString({ message: "Customer name must be a string." })
	@IsNotEmpty({ message: "Customer name cannot be empty." })
	customerName?: string;

	@IsOptional()
	@IsString({ message: "Customer address must be a string." })
	@IsNotEmpty({ message: "Customer address cannot be empty." })
	customerAddress?: string;

	@IsOptional()
	@IsString({ message: "Customer phone must be a string." })
	@IsNotEmpty({ message: "Customer phone cannot be empty." })
	customerPhone?: string;

	@IsArray({ message: "Items must be an array." })
	@ValidateNested({ each: true, message: "Each order item must be valid." })
	@Type(() => CreateOrderDetailDto)
	items: CreateOrderDetailDto[];
}