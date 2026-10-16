import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { isPrismaNotFoundError } from '../common/utils/prisma-error.util';
import { Prisma } from '@prisma/client';
@Injectable()
export class MenuService {
	constructor(private readonly prisma: PrismaService) {}

	private async validateIngredientUnit(
		tx: Prisma.TransactionClient,
		ingredientId: number,
		unitId: number,
		): Promise<void> {
		const ingredient = await tx.ingredient.findUnique({
			where: { id: ingredientId },
			include: { unit: true },
		});

		if (!ingredient) {
			throw new NotFoundException(
			`Ingredient with id ${ingredientId} not found`,
			);
		}

		const unit = await tx.unitOfMeasure.findUnique({
			where: { id: unitId },
		});

		if (!unit) {
			throw new NotFoundException(`Unit with id ${unitId} not found`);
		}

		if (ingredient.unit.type !== unit.type) {
			throw new BadRequestException(
			`Unit type "${unit.type}" is not compatible with ingredient "${ingredient.name}". Expected "${ingredient.unit.type}".`,
			);
		}
	}
	
	async getMenuSections(){
		const menu = await this.prisma.menuCategory.findMany({
			include: {
				items: true
			}
		});
		return menu.map(category => ({
			title: category.name,
			items: category.items.map(item => ({
				id: item.id,
				name: item.name,
				description: item.description,
				price: `$${Number(item.price).toLocaleString('es-CO')} COP`,
			})),
		}));
	}

	async getFeaturedMenuItems(){
		const featuredDishes = await this.prisma.menuItem.findMany({
			where: {
				isFavorite: true,
				isAvailable: true,
			}
		});
		return featuredDishes.map((item) => ({
			id: item.id,
			name: item.name,
			description: item.description,
			price: `$${Number(item.price).toLocaleString('es-CO')} COP`,
			image: item.imageUrl
		}));
	}

	async getManagementMenuData(){
		const disheData = await this.prisma.menuItem.findMany({
			include: {
				category: true,
			}
		});
		return disheData.map((item) => ({
			id: item.id,
			name: item.name,
			category: item.category.name,
			description: item.description,
			price: `$${Number(item.price).toLocaleString('es-CO')} COP`,
			image: item.imageUrl,
			active: item.isAvailable,
			featured: item.isFavorite,
			showImage: item.showImageInGallery,
			recipe: item.internalRecipe,
		}));
	}

	async createMenuItem(data: CreateMenuItemDto) {
		const { ingredients, ...menuItemData } = data;

		return this.prisma.$transaction(async (tx) => {
			for (const entry of ingredients ?? []) {
			await this.validateIngredientUnit(
				tx,
				entry.ingredientId,
				entry.unitId,
			);
			}

			const newDish = await tx.menuItem.create({
			data: menuItemData,
			});

			if (ingredients?.length) {
			await tx.recipe.createMany({
				data: ingredients.map((entry) => ({
				itemId: newDish.id,
				ingredientId: entry.ingredientId,
				quantity: entry.quantity,
				unitId: entry.unitId,
				})),
			});
			}

			return tx.menuItem.findUnique({
			where: { id: newDish.id },
			include: { recipes: true },
			});
		});
	}

	async updateMenuItem(id: number, data: UpdateMenuItemDto) {
		const { ingredients, ...menuItemData } = data;

		try {
			return await this.prisma.$transaction(async (tx) => {
			const dish = await tx.menuItem.findUnique({
				where: { id },
			});

			if (!dish) {
				throw new NotFoundException(`Menu id ${id} not found`);
			}

			// Validate every recipe before changing the dish.
			for (const entry of ingredients ?? []) {
				const recipe = await tx.recipe.findUnique({
				where: { id: entry.id },
				});

				if (!recipe || recipe.itemId !== id) {
				throw new NotFoundException(
					`Recipe with id ${entry.id} not found for menu item ${id}`,
				);
				}

				await this.validateIngredientUnit(
				tx,
				entry.ingredientId ?? recipe.ingredientId,
				entry.unitId ?? recipe.unitId,
				);
			}

			await tx.menuItem.update({
				where: { id },
				data: menuItemData,
			});

			for (const entry of ingredients ?? []) {
				await tx.recipe.update({
				where: { id: entry.id },
				data: {
					...(entry.ingredientId !== undefined && {
					ingredientId: entry.ingredientId,
					}),
					...(entry.quantity !== undefined && {
					quantity: entry.quantity,
					}),
					...(entry.unitId !== undefined && {
					unitId: entry.unitId,
					}),
				},
				});
			}

			return tx.menuItem.findUnique({
				where: { id },
				include: { recipes: true },
			});
			});
		} catch (error) {
			if (isPrismaNotFoundError(error)) {
			throw new NotFoundException(`Menu id ${id} not found`);
			}
			throw error;
		}
	}

	async deleteMenuItem(id: number) {
		try {
			return await this.prisma.$transaction(async (tx) => {
				const dish = await tx.menuItem.findUnique({
					where: { id },
					include: {
					recipes: true,
					orderDetails: {
						select: { id: true },
					},
					},
				});

				if (!dish) {
					throw new NotFoundException(`Menu id ${id} not found`);
				}

				if (dish.orderDetails.length > 0) {
					return await tx.menuItem.update({
					where: { id },
					data: { isAvailable: false },
					include: { recipes: true },
					});
				}

				await tx.recipe.deleteMany({
					where: { itemId: id },
				});

				return await tx.menuItem.delete({
					where: { id },
				});
			});
		} catch (error) {
			if (isPrismaNotFoundError(error)) {
				throw new NotFoundException(`Menu id ${id} not found`);
			}
			throw error;
		}
	}

}
