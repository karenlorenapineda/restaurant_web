import { BadRequestException } from '@nestjs/common';
import { OrderType } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';

export function validateOrderType(data: CreateOrderDto): void {
	if (data.type === OrderType.dine_in && !data.tableId) {
		throw new BadRequestException('Se requiere una mesa para pedidos en el local.');
	}

	if (data.type !== OrderType.dine_in && data.tableId) {
		throw new BadRequestException('No se puede asignar una mesa a este tipo de pedido.');
	}

	if (data.type === OrderType.delivery) {
		if (!data.customerAddress) {
			throw new BadRequestException('Se requiere una dirección para pedidos a domicilio.');
		}
		if (!data.customerPhone) {
			throw new BadRequestException('Se requiere un teléfono para pedidos a domicilio.');
		}
	}
}