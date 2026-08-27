import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Prisma } from '@prisma/client';

const menuItemWithRecipes = Prisma.validator<Prisma.MenuItemDefaultArgs>()({
    include: {
        recipes: {
            include: {
                ingredient: true,
                unit: true,
            },
        },
    },
});

type MenuItemWithRecipes = Prisma.MenuItemGetPayload<typeof menuItemWithRecipes>;
@Injectable()
export class MenuService {
	constructor(private readonly prisma: PrismaService) {}
	private async validateRecipeUnit(ingredientId: number, unitId: number, prisma: Prisma.TransactionClient = this.prisma,) {
		const ingredient = await prisma.ingredient.findUnique({
			where: {id: ingredientId,},
			include: {unit: true,},
		});

		if (!ingredient) {
			throw new NotFoundException(
				`Ingredient ${ingredientId} not found`,
			);
		}

		const recipeUnit = await prisma.unitOfMeasure.findUnique({
			where: {id: unitId,},
		});

		if (!recipeUnit) {
			throw new NotFoundException(
				`Unit ${unitId} not found`,
			);
		}

		if (ingredient.unit.type !== recipeUnit.type) {
			throw new BadRequestException(
				`Unit ${recipeUnit.name} is not compatible with ingredient ${ingredient.name}`,
			);
		}
	}

	private formatMenuItem(item: MenuItemWithRecipes) {
		return {
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
				unit: recipe.unit.abbreviation,
			})),
		};
	}

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

	async getFavoriteMenuItems(){
		const favorites = await this.prisma.menuItem.findMany({
			where: {
				isFavorite: true,
				isAvailable: true,
			}
		});
		return favorites.map((item) => ({
			id: item.id,
			name: item.name,
			description: item.description,
			price: item.price,
			image: item.imageUrl
		}));
	}

	async getManagementMenuData(){
		const menu = await this.prisma.menuCategory.findMany({
			include: {
				items: {
					include: {
						recipes: {
							include: {
								ingredient: true,
								unit: true
							}
						}
					}
				}
			}
		});
		return menu.map((category) => ({
			title: category.name,
			items: category.items.map((item) =>
				this.formatMenuItem(item)
			),
		}));
	}

	async createMenuItem(data: CreateMenuItemDto){
		if(data.recipe) {
			for (const recipeItem of data.recipe) {
				await this.validateRecipeUnit(
					recipeItem.ingredientId,
					recipeItem.unitId,
				);
			}
		}
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
							unitId: recipeItem.unitId,
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
						ingredient: true,
						unit: true,
					}
				}
			}
		});

		if (!createdItem) {
			throw new NotFoundException(
				`Menu item ${newDish.id} not found`,
			);
		}

		return this.formatMenuItem(createdItem);
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
					await this.validateRecipeUnit(
						recipeItem.ingredientId,
						recipeItem.unitId,
						tx,
					);
					await tx.recipe.create({
						data: {
							itemId: id,
							ingredientId: recipeItem.ingredientId,
							quantity: recipeItem.quantity,
							unitId: recipeItem.unitId,
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

					const ingredientId = recipeItem.ingredientId ?? existingRecipe.ingredientId;
					const unitId = recipeItem.unitId ?? existingRecipe.unitId;

					await this.validateRecipeUnit(
						ingredientId,
						unitId,
						tx,
					);

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
						ingredient: true,
						unit: true,
					}
				}
			}
		});

		if (!updatedItem) {
			throw new NotFoundException(
				`Menu item ${id} not found`,
			);
		}

		return this.formatMenuItem(updatedItem);
	}

	async deleteMenuItem(id: number) {

		const menuItem = await this.prisma.menuItem.findUnique({
			where: {id: id},
			include: {
				recipes: {
					include:{
						ingredient: true,
						unit: true,
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

		return this.formatMenuItem(menuItem);
	}

	async getCategories(){
		return await this.prisma.menuCategory.findMany();
	}

	async createCategory(data: CreateCategoryDto){
		return await this.prisma.menuCategory.create({
			data: { 
				name: data.name,
				description: data.description,
			 }
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
