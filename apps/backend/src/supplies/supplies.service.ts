import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateIngredientDto } from '../supplies/dto/create-ingredient.dto';
import { UpdateIngredientDto } from '../supplies/dto/update-ingredient.dto';
import { isPrismaNotFoundError } from '../common/utils/prisma-error.util';

@Injectable()
export class SuppliesService {
	constructor(private readonly prisma: PrismaService){}

	async getIngredients() {
		const items = await this.prisma.ingredient.findMany({
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

	async createIngredient(data: CreateIngredientDto) {
		return await this.prisma.ingredient.create({
			data: data,
		});
	}

	async updateIngredient(id: number, data: UpdateIngredientDto) {
		try {
			return await this.prisma.ingredient.update({
				where: {id: id},
				data: data
			});
		} catch(error) {
			if (isPrismaNotFoundError(error)) {
				throw new NotFoundException(`Ingredient id ${id} not found`);
			}
			throw error;
		}
	}

	async deleteIngredient(id: number) {
		try {
			return await this.prisma.ingredient.delete({
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
