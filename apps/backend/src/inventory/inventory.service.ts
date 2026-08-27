import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { CreateUnitOfMeasureDto } from './dto/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from './dto/update-unit-of-measure.dto';

@Injectable()
export class InventoryService {
	constructor(private readonly prisma: PrismaService) {}

	async getInventoryItems() {
		return await this.prisma.inventoryItem.findMany({
			include: {
				unit: true,
			}
		});
	}

	async createInventoryItem(data: CreateInventoryItemDto) {
		return await this.prisma.inventoryItem.create({
			data: {
				name: data.name,
				unitId: data.unitId,
				unitCost: data.unitCost,
				currentStock: data.currentStock,
				minimumStock: data.minimumStock,
			}
		});
	}

	async updateInventoryItem(id: number, data: UpdateInventoryItemDto) {
		return await this.prisma.inventoryItem.update({
			where: {id: id},
			data: data
		});
	}

	async deleteInventoryItem(id: number) {
		return await this.prisma.inventoryItem.delete({
			where: {id: id}
		})
	}

	async getIngredients() {
		return await this.prisma.ingredient.findMany({
			include: {
				unit: true,
			}
		});
	}

	async createIngredient(data: CreateIngredientDto) {
		return await this.prisma.ingredient.create({
			data: {
				name: data.name,
				unitId: data.unitId,
				unitCost: data.unitCost,
				currentStock: data.currentStock,
				minimumStock: data.minimumStock,
			}
		});
	}

	async updateIngredient(id: number, data: UpdateIngredientDto) {
		return await this.prisma.ingredient.update({
			where: {id: id},
			data: data
		});
	}

	async deleteIngredient(id: number) {
		return await this.prisma.ingredient.delete({
			where: {id: id}
		})
	}

	async getUnits() {
		return await this.prisma.unitOfMeasure.findMany();
	}

	async createUnit(data: CreateUnitOfMeasureDto) {
		return await this.prisma.unitOfMeasure.create({
			data: {
				abbreviation: data.abbreviation,
				name: data.name,
				type: data.type,
			}
		});
	}

	async updateUnit(id: number, data: UpdateUnitOfMeasureDto) {
		return await this.prisma.unitOfMeasure.update({
			where: {id: id},
			data: data
		});
	}

	async deleteUnit(id: number) {
		return await this.prisma.unitOfMeasure.delete({
			where: {id: id}
		})
	}
}
