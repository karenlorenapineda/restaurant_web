import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

type RecipeResult = Record<
  string,
  {
    itemId: number;
    name: string;
    ingredients: {
      id: number;
      ingredientId: number;
      unitId: number;
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
		const result: RecipeResult = {};

		for (const recipe of recipes) {
		const key = String(recipe.itemId);

		if (!result[key]) {
			result[key] = {
			itemId: recipe.itemId,
			name: recipe.item.name,
			ingredients: [],
			recipe: recipe.item.internalRecipe,
			};
		}

		result[key]!.ingredients.push({
			id: recipe.id,
			ingredientId: recipe.ingredientId,
			unitId: recipe.unitId,
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
		const result: RecipeResult = {};

		for (const recipe of recipes) {
		const key = String(recipe.itemId);

		if (!result[key]) {
			result[key] = {
			itemId: recipe.itemId,
			name: recipe.item.name,
			ingredients: [],
			recipe: recipe.item.internalRecipe,
			};
		}

		result[key]!.ingredients.push({
			id: recipe.id,
			ingredientId: recipe.ingredientId,
			unitId: recipe.unitId,
			quantity: recipe.quantity.toString(),
			supplyName: recipe.ingredient.name,
			unit: recipe.unit.abbreviation,
		});
		}
		return result;
	}

	async createRecipes(data: CreateRecipeDto) {
		return this.prisma.$transaction(async (tx) => {
			for (const entry of data.ingredients) {
			const ingredient = await tx.ingredient.findUnique({
				where: { id: entry.ingredientId },
				include: { unit: true },
			});

			if (!ingredient) {
				throw new NotFoundException(
				`Ingredient with id ${entry.ingredientId} not found`,
				);
			}

			const unit = await tx.unitOfMeasure.findUnique({
				where: { id: entry.unitId },
			});

			if (!unit) {
				throw new NotFoundException(
				`Unit with id ${entry.unitId} not found`,
				);
			}

			if (ingredient.unit.type !== unit.type) {
				throw new BadRequestException(
				`Unit type "${unit.type}" is not compatible with ingredient "${ingredient.name}". Expected "${ingredient.unit.type}".`,
				);
			}
			}

			return tx.recipe.createMany({
			data: data.ingredients.map((entry) => ({
				itemId: data.itemId,
				ingredientId: entry.ingredientId,
				quantity: entry.quantity,
				unitId: entry.unitId,
			})),
			});
		});
	}

	async updateRecipes(data: UpdateRecipeDto) {
		return this.prisma.$transaction(async (tx) => {
			const updatedRecipes = [];

			for (const entry of data.ingredients) {
			const currentRecipe = await tx.recipe.findUnique({
				where: { id: entry.id },
			});

			if (!currentRecipe) {
				throw new NotFoundException(
				`Recipe with id ${entry.id} not found`,
				);
			}

			const ingredientId =
				entry.ingredientId ?? currentRecipe.ingredientId;
			const unitId = entry.unitId ?? currentRecipe.unitId;

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
				throw new NotFoundException(
				`Unit with id ${unitId} not found`,
				);
			}

			if (ingredient.unit.type !== unit.type) {
				throw new BadRequestException(
				`Unit type "${unit.type}" is not compatible with ingredient "${ingredient.name}". Expected "${ingredient.unit.type}".`,
				);
			}

			const updatedRecipe = await tx.recipe.update({
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

			updatedRecipes.push(updatedRecipe);
			}

			return updatedRecipes;
		});
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
