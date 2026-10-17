import { OrderType } from '@prisma/client';

export function formatOrderResponse(order: any) {
	let tableOrLocation = 'Para llevar';
	if (order.type === OrderType.dine_in) {
		tableOrLocation = order.table
			? `Mesa ${order.table.tableNumber}`
			: 'Mesa no asignada';
	} else if (order.type === OrderType.delivery) {
		tableOrLocation = order.customerAddress
			? `Domicilio (${order.customerAddress})`
			: 'Domicilio';
	}

	const items = order.orderDetails.map((detail: any) => ({
		itemId: detail.itemId,
		name: detail.item.name,
		quantity: detail.quantity,
		unitPrice: detail.unitPrice,
		notes: detail.notes ?? null,
		removedIngredients: detail.modifications.map(
			(mod: any) => mod.recipe.ingredient.name,
		),
	}));

	return {
		id: order.id,
		type: order.type,
		status: order.status,
		customer: order.customerName ?? 'Cliente general',
		customerPhone: order.customerPhone ?? null,
		tableOrLocation,
		total: `$${Number(order.total).toLocaleString('es-CO')} COP`,
		createdAt: order.orderDate,
		items,
	};
}