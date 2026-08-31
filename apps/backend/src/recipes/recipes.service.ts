import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

type RecipeResul = Record<
	string,
	{
	ingredients: {
		quantity: string;
		supplyName: string;
		unit: string;
	}[];
	recipe: string | null;
	}
>;

@Injectable()
export class RecipesService {
	constructor(private readonly prisma: PrismaService) {}

	async getRecipes(){
		const recipes = await this.prisma.recipe.findMany({
			include: {
				item: true,
				ingredient: true,
				unit: true,
			}
		});
		const result: RecipeResul = {};
		for (const recipe of recipes) {
			const itemName = recipe.item.name;
			if (!result[itemName]) {
				result[itemName] = {
					ingredients: [],
					recipe: recipe.item.internalRecipe,
				};
			}
			result[itemName].ingredients.push({
				quantity: recipe.quantity.toString(),
				supplyName: recipe.ingredient.name,
				unit: recipe.unit.abbreviation,
			});
		}
		return result;
	}

	async getRecipesDish(dishId: number) {
		const recipes = await this.prisma.recipe.findMany({
			where: {itemId: dishId},
			include: {
				item: true,
				ingredient: true,
				unit: true,
			},
		});
		const result: RecipeResul = {};
		for (const recipe of recipes) {
			const itemName = recipe.item.name;
			if (!result[itemName]) {
				result[itemName] = {
					ingredients: [],
					recipe: recipe.item.internalRecipe,
				};
			}
			result[itemName].ingredients.push({
				quantity: recipe.quantity.toString(),
				supplyName: recipe.ingredient.name,
				unit: recipe.unit.abbreviation,
			});
		}
		return result;
	}

	async createRecipes(data: CreateRecipeDto) {
		const {itemId, ingredients } = data;
		
		const recipes = await this.prisma.recipe.createMany({
			data: ingredients.map((ingredient) => ({
				itemId,
				ingredientId: ingredient.ingredientId,
				quantity: ingredient.quantity,
				unitId: ingredient.unitId,
			})),
		});

		return recipes;
	}

	async updateRecipes(data: UpdateRecipeDto) {
		const updatedRecipes = [];
		for (const recipeUpdate of data.ingredients) {
			const currentRecipe = await this.prisma.recipe.findUnique({
				where: {id: recipeUpdate.id},
				include: {
					ingredient: {
						include: {
							unit: true,
						}
					}
				}
			});
			if (!currentRecipe) {
				throw new NotFoundException(`Recipe with id ${recipeUpdate.id} not found`);
			}
			const ingredientId = recipeUpdate.ingredientId ?? currentRecipe.ingredientId;
			const unitId = recipeUpdate.unitId ?? currentRecipe.unitId;

			const ingredient = await this.prisma.ingredient.findUnique({
				where: {id: ingredientId},
				include: {unit: true},
			});

			if (!ingredient){
				throw new NotFoundException(`Ingredient with id ${ingredientId} not found`);
			}
			const unit = await this.prisma.unitOfMeasure.findUnique({
				where: {id: unitId},
			});

			if (!unit){
				throw new NotFoundException( `Unit with id ${unitId} not found`);
			}

			if (ingredient.unit.type !== unit.type){
				throw new BadRequestException(`Unit type "${unit.type}" is not compatible with ingredient "${ingredient.name}". Expected "${ingredient.unit.type}".`);
			}

			const updatedRecipe = await this.prisma.recipe.update({
				where: {id: recipeUpdate.id},
				data: {
					...(recipeUpdate.ingredientId !== undefined && {
						ingredientId: recipeUpdate.ingredientId,
					}),
					...(recipeUpdate.quantity !== undefined && {
						quantity: recipeUpdate.quantity,
					}),
					...(recipeUpdate.unitId !== undefined && {
						unitId: recipeUpdate.unitId,
					}),
				}
			});

			updatedRecipes.push(updatedRecipe);
		}
		return updatedRecipes;
	}

	async deleteRecipes(ids: number[]) {
		const recipes = await this.prisma.recipe.findMany({
			where: {
				id: {
					in: ids,
				}
			}
		});
		await this.prisma.recipe.deleteMany({
			where: {
				id: {
					in: ids,
				}
			}
		});
		return recipes;
	}
}
