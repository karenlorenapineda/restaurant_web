import { OrderStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateOrderDto {
	@IsEnum(OrderStatus, {message: "Status must be one of the following values: queued, preparing, ready, completed, cancelled.",})
	status: OrderStatus;
}
