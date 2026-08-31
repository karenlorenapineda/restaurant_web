import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { isPrismaNotFoundError } from '../common/utils/prisma-error.util';
@Injectable()
export class InventoryService {
	constructor(private readonly prisma: PrismaService) {}

	async getInventoryItems() {
		const items = await this.prisma.inventoryItem.findMany({
			include: {
				unit: true,
			},
		});
		return items.map((item) => ({
			id: item.id,
			const: `$${Number(item.unitCost).toLocaleString('es-CO')} COP`,
			name: item.name,
			stock: item.currentStock.toString(),
			threshold: item.minimumStock.toString(),
			unit: item.unit.abbreviation,
		}));
	}

	async createInventoryItem(data: CreateInventoryItemDto) {
		return await this.prisma.inventoryItem.create({
			data: data,
		});
	}

	async updateInventoryItem(id: number, data: UpdateInventoryItemDto) {
		try {
			return await this.prisma.inventoryItem.update({
				where: {id: id},
				data: data
			});
		} catch (error) {
			if (isPrismaNotFoundError(error)) {
				throw new NotFoundException(`Ingredient id ${id} not found`);
			}
			throw error;
		}		
	}

	async deleteInventoryItem(id: number) {
		try {
			return await this.prisma.inventoryItem.delete({
				where: {id: id}
			});
		} catch (error) {
			if (isPrismaNotFoundError(error)) {
				throw new NotFoundException(`Ingredient id ${id} not found`);
			}
			throw error;
		}
	}
}
