import { BadRequestException } from '@nestjs/common';
import { OrderType } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';

export function validateOrderType(data: CreateOrderDto): void {
	if (data.type === OrderType.dine_in && !data.tableId) {
		throw new BadRequestException('A table is required for dine-in orders.');
	}

	if (data.type !== OrderType.dine_in && data.tableId) {
		throw new BadRequestException('A table cannot be assigned to this order type.');
	}

	if (data.type === OrderType.delivery) {
		if (!data.customerAddress) {
			throw new BadRequestException('An address is required for delivery orders.');
		}
		if (!data.customerPhone) {
			throw new BadRequestException('A phone number is required for delivery orders.');
		}
	}
}