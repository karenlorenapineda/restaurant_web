import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { RecipesService } from '../recipes/recipes.service';
import { isPrismaNotFoundError } from '../common/utils/prisma-error.util';
@Injectable()
export class MenuService {
	constructor(private readonly prisma: PrismaService,
		private readonly recipeService: RecipesService,
	) {}

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
			const newDish = await tx.menuItem.create({
			data: menuItemData,
			});

			if (ingredients?.length) {
			await tx.recipe.createMany({
				data: ingredients.map((ingredient) => ({
				itemId: newDish.id,
				ingredientId: ingredient.ingredientId,
				quantity: ingredient.quantity,
				unitId: ingredient.unitId,
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
		try {
			const { ingredients, ...menuItemData } = data;
			await this.prisma.menuItem.update({
				where: { id: id },
				data: menuItemData,
			});
	
			if (ingredients?.length) {
				await this.recipeService.updateRecipes({
					ingredients: ingredients,
				});
			}
			return await this.prisma.menuItem.findUnique({
				where: { id: id },
				include: { recipes: true }
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
