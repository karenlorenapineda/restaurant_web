import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class MenuService {
	constructor(private readonly prisma: PrismaService) {}

	async getMenuData(){
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
				price: item.price,
				image: item.imageUrl
			})),
		}));
	}

	async getManagementMenuData(){
		const menu = await this.prisma.menuCategory.findMany({
			include: {
				items: {
					include: {
						recipes: {
							include: {
								ingredient: {
									include: {
										unit: true
									}
								}
							}
						}
					}
				}
			}
		});
		return menu.map(category => ({
			title: category.name,
			items: category.items.map(item => ({
				id: item.id,
				name: item.name,
				description: item.description,
				price: item.price,
				categoryId: item.categoryId,
				image: item.imageUrl,
				isAvailable: item.isAvailable,
				internalRecipe: item.internalRecipe,
				isFavorite: item.isFavorite,
				showImageInGallery: item.showImageInGallery,
				recipes: item.recipes.map((recipe) => ({
					id: recipe.id,
					ingredientId: recipe.ingredientId,
					ingredientName: recipe.ingredient.name,
					quantity: recipe.quantity,
					unit: recipe.ingredient.unit.abbreviation
				})),
			})),
		}));
	}

	async createMenuItem(data: CreateMenuItemDto){
		const newDish = await this.prisma.menuItem.create({
			data: {
				name: data.name,
				description: data.description,
				price: data.price,
				categoryId: data.categoryId,
				imageUrl: data.imageUrl || null,
				isAvailable: data.isAvailable,
				internalRecipe: data.internalRecipe,
				isFavorite: data.isFavorite,
				showImageInGallery: data.showImageInGallery,

				...(data.recipe && {
					recipes: {
						create: data.recipe.map(recipeItem => ({
							ingredientId: recipeItem.ingredientId,
							quantity: recipeItem.quantity,
						})),
					},
				}),
			},
		});

		const createdItem = await this.prisma.menuItem.findUnique({
			where: {id: newDish.id},
			include: {
				recipes: {
					include: {
						ingredient: {
							include: {
								unit: true,
							}
						}
					}
				}
			}
		});

		if (!createdItem) {
			throw new NotFoundException(
				`Menu item ${newDish.id} not found`,
			);
		}

		return {
			id: createdItem.id,
			name: createdItem.name,
			description: createdItem.description,
			price: createdItem.price,
			categoryId: createdItem.categoryId,
			image: createdItem.imageUrl,
			isAvailable: createdItem.isAvailable,
			internalRecipe: createdItem.internalRecipe,
			isFavorite: createdItem.isFavorite,
			showImageInGallery: createdItem.showImageInGallery,
			recipes: createdItem.recipes.map(recipe => ({
				id: recipe.id,
				ingredientId: recipe.ingredientId,
				ingredientName: recipe.ingredient.name,
				quantity: recipe.quantity,
				unit: recipe.ingredient.unit.abbreviation,
			})),
		};
	}

	async updateMenuItem(id: number, data: UpdateMenuItemDto) {
		const { recipe, ...menuItemData } = data;

		await this.prisma.$transaction(async (tx) => {
			await tx.menuItem.update({
				where: {id: id},
				data: menuItemData,
			});

			if (recipe?.create) {
				for (const recipeItem of recipe.create) {
					await tx.recipe.create({
						data: {
							itemId: id,
							ingredientId: recipeItem.ingredientId,
							quantity: recipeItem.quantity,
						},
					});
				}
			}

			if (recipe?.update) {
				for (const recipeItem of recipe.update) {
					const { recipeId, ...recipeData } = recipeItem;
					
					const existingRecipe = await tx.recipe.findFirst({
						where: {
							id: recipeId,
							itemId: id
						}
					});

					if (!existingRecipe) {
						throw new NotFoundException(
							`Recipe ${recipeId} not found for menu item ${id}`
						);
					}

					await tx.recipe.update({
						where: { id: recipeId },
						data: recipeData,
					});
				}
			}

			if (recipe?.delete) {
				await tx.recipe.deleteMany({
					where: {
						id: { in: recipe.delete },
						itemId: id
					}
				});
			}

		});
		
		const updatedItem = await this.prisma.menuItem.findUnique({
			where: {id: id},
			include: {
				recipes: {
					include: {
						ingredient: {
							include: {
								unit: true
							}
						}
					}
				}
			}
		});

		if (!updatedItem) {
			throw new NotFoundException(
				`Menu item ${id} not found`,
			);
		}

		return {
			id: updatedItem.id,
			name: updatedItem.name,
			description: updatedItem.description,
			price: updatedItem.price,
			categoryId: updatedItem.categoryId,
			image: updatedItem.imageUrl,
			isAvailable: updatedItem.isAvailable,
			internalRecipe: updatedItem.internalRecipe,
			isFavorite: updatedItem.isFavorite,
			showImageInGallery: updatedItem.showImageInGallery,
			recipe: updatedItem.recipes.map((recipe) => ({
				id: recipe.id,
				ingredientId: recipe.ingredientId,
				ingredientName: recipe.ingredient.name,
				quantity: recipe.quantity,
				unit: recipe.ingredient.unit.abbreviation,
			})),
		};
	}

	async deleteMenuItem(id: number) {

		const menuItem = await this.prisma.menuItem.findUnique({
			where: {id: id},
			include: {
				recipes: {
					include:{
						ingredient:{
							include:{
								unit: true
							}
						}
					}
				}
			}
		});
		
		if (!menuItem) {
			throw new NotFoundException(
				`Menu item ${id} not found`,
			);
		}

		await this.prisma.$transaction(async (tx) => {

			await tx.recipe.deleteMany({
				where: {itemId: id}
			});

			await tx.menuItem.delete({
				where: {id: id}
			});
		});

		return {
			id: menuItem.id,
			name: menuItem.name,
			description: menuItem.description,
			price: menuItem.price,
			categoryId: menuItem.categoryId,
			image: menuItem.imageUrl,
			isAvailable: menuItem.isAvailable,
			internalRecipe: menuItem.internalRecipe,
			isFavorite: menuItem.isFavorite,
			showImageInGallery: menuItem.showImageInGallery,
			recipes: menuItem.recipes.map((recipe) => ({
				id: recipe.id,
				ingredientId: recipe.ingredientId,
				ingredientName: recipe.ingredient.name,
				quantity: recipe.quantity,
				unit: recipe.ingredient.unit.abbreviation
			})),
		};
	}

	async getCategories(){
		return await this.prisma.menuCategory.findMany();
	}

	async createCategory(data: CreateCategoryDto){
		return await this.prisma.menuCategory.create({
			data: { name: data.name }
		});
	}

	async updateCategory(id: number, data: UpdateCategoryDto){
		return await this.prisma.menuCategory.update({
			where: { id: id},
			data: data
		});
	}

	async deleteCategory(id: number) {
		return await this.prisma.menuCategory.delete({
			where: {id: id}
		});
	}
}
