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

	async createMenuItem(data: CreateMenuItemDto){
		const { ingredients, ...menuItemData } = data;
		const newDish = await this.prisma.menuItem.create({
			data: menuItemData,
		});
		if (ingredients?.length) {
			await this.recipeService.createRecipes({
				itemId: newDish.id,
				ingredients: ingredients,
			});
		}
		return this.prisma.menuItem.findUnique({
			where: { id: newDish.id },
			include: { recipes: true }
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
			const deleteDish = await this.prisma.menuItem.findUnique({
				where: {id: id},
				include: { recipes: true }
			});
			
			await this.prisma.recipe.deleteMany({
				where: {itemId: id}
			});
	
			await this.prisma.menuItem.delete({
				where: {id: id}
			});
			return deleteDish;
		} catch (error) {
			if (isPrismaNotFoundError(error)) {
				throw new NotFoundException(`Menu id ${id} not found`);
			}
			throw error;
		}
	}

}
