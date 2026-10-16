import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RecipesService } from './recipes.service';

describe('RecipesService', () => {
  let service: RecipesService;

  const prismaMock = {
    recipe: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    ingredient: {
      findUnique: jest.fn(),
    },
    unitOfMeasure: {
      findUnique: jest.fn(),
    },
  };

  const makeRecipeRow = (
    id: number,
    itemId: number,
    name: string,
    ingredientName: string,
    quantity: string,
    internalRecipe: string | null,
  ) => ({
    id,
    itemId,
    ingredientId: id,
    unitId: 1,
    quantity: new Prisma.Decimal(quantity),
    item: { name, internalRecipe },
    ingredient: { name: ingredientName },
    unit: { abbreviation: 'g' },
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
  });

  describe('getRecipes', () => {
    it('groups ingredients by dish and converts quantities to strings', async () => {
      prismaMock.recipe.findMany.mockResolvedValue([
        makeRecipeRow(1, 10, 'Pizza', 'Flour', '250', 'Bake'),
        makeRecipeRow(2, 10, 'Pizza', 'Cheese', '80.5', 'Bake'),
        makeRecipeRow(3, 20, 'Salad', 'Lettuce', '100', null),
      ]);

      await expect(service.getRecipes()).resolves.toEqual({
        Pizza: {
          ingredients: [
            { quantity: '250', supplyName: 'Flour', unit: 'g' },
            { quantity: '80.5', supplyName: 'Cheese', unit: 'g' },
          ],
          recipe: 'Bake',
        },
        Salad: {
          ingredients: [
            { quantity: '100', supplyName: 'Lettuce', unit: 'g' },
          ],
          recipe: null,
        },
      });

      expect(prismaMock.recipe.findMany).toHaveBeenCalledWith({
        include: { item: true, ingredient: true, unit: true },
      });
    });

    it('returns an empty object when no recipes exist', async () => {
      prismaMock.recipe.findMany.mockResolvedValue([]);

      await expect(service.getRecipes()).resolves.toEqual({});
    });

    it('propagates database errors', async () => {
      const error = new Error('Database query failed');
      prismaMock.recipe.findMany.mockRejectedValue(error);

      await expect(service.getRecipes()).rejects.toBe(error);
    });
  });

  describe('getRecipesDish', () => {
    it('filters by dish ID and groups its ingredients', async () => {
      prismaMock.recipe.findMany.mockResolvedValue([
        makeRecipeRow(1, 10, 'Pizza', 'Flour', '250', 'Bake'),
        makeRecipeRow(2, 10, 'Pizza', 'Cheese', '80.5', 'Bake'),
      ]);

      await expect(service.getRecipesDish(10)).resolves.toEqual({
        Pizza: {
          ingredients: [
            { quantity: '250', supplyName: 'Flour', unit: 'g' },
            { quantity: '80.5', supplyName: 'Cheese', unit: 'g' },
          ],
          recipe: 'Bake',
        },
      });

      expect(prismaMock.recipe.findMany).toHaveBeenCalledWith({
        where: { itemId: 10 },
        include: { item: true, ingredient: true, unit: true },
      });
    });

    it('returns an empty object when the dish has no recipes', async () => {
      prismaMock.recipe.findMany.mockResolvedValue([]);

      await expect(service.getRecipesDish(10)).resolves.toEqual({});
    });

    it('propagates database errors', async () => {
      const error = new Error('Database query failed');
      prismaMock.recipe.findMany.mockRejectedValue(error);

      await expect(service.getRecipesDish(10)).rejects.toBe(error);
    });
  });

  describe('createRecipes', () => {
    it('creates all ingredients for the specified dish', async () => {
      const data = {
        itemId: 10,
        ingredients: [
          { ingredientId: 1, quantity: 250, unitId: 1 },
          { ingredientId: 2, quantity: 0.5, unitId: 2 },
        ],
      };

      prismaMock.recipe.createMany.mockResolvedValue({ count: 2 });

      await expect(service.createRecipes(data)).resolves.toEqual({
        count: 2,
      });

      expect(prismaMock.recipe.createMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.recipe.createMany).toHaveBeenCalledWith({
        data: [
          { itemId: 10, ingredientId: 1, quantity: 250, unitId: 1 },
          { itemId: 10, ingredientId: 2, quantity: 0.5, unitId: 2 },
        ],
      });
    });

    it('propagates creation errors', async () => {
      const error = new Error('Recipe creation failed');
      prismaMock.recipe.createMany.mockRejectedValue(error);

      await expect(
        service.createRecipes({
          itemId: 10,
          ingredients: [
            { ingredientId: 1, quantity: 250, unitId: 1 },
          ],
        }),
      ).rejects.toBe(error);
    });
  });

  describe('updateRecipes', () => {
    beforeEach(() => {
      prismaMock.recipe.findUnique.mockResolvedValue({
        id: 1,
        ingredientId: 5,
        unitId: 1,
      });

      prismaMock.ingredient.findUnique.mockResolvedValue({
        id: 5,
        name: 'Flour',
        unit: { type: 'weight' },
      });

      prismaMock.unitOfMeasure.findUnique.mockResolvedValue({
        id: 1,
        type: 'weight',
      });
    });

    it('updates quantity while retaining the existing ingredient and unit', async () => {
      const updatedRecipe = {
        id: 1,
        ingredientId: 5,
        unitId: 1,
        quantity: new Prisma.Decimal(125),
      };

      prismaMock.recipe.update.mockResolvedValue(updatedRecipe);

      await expect(
        service.updateRecipes({
          ingredients: [{ id: 1, quantity: 125 }],
        }),
      ).resolves.toEqual([updatedRecipe]);

      expect(prismaMock.recipe.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          ingredient: {
            include: { unit: true },
          },
        },
      });

      expect(prismaMock.ingredient.findUnique).toHaveBeenCalledWith({
        where: { id: 5 },
        include: { unit: true },
      });

      expect(prismaMock.unitOfMeasure.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(prismaMock.recipe.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantity: 125 },
      });
    });

    it('uses the new ingredient and unit when both are provided', async () => {
      const updatedRecipe = {
        id: 1,
        ingredientId: 8,
        unitId: 2,
        quantity: new Prisma.Decimal(0.5),
      };

      prismaMock.ingredient.findUnique.mockResolvedValue({
        id: 8,
        name: 'Sugar',
        unit: { type: 'weight' },
      });

      prismaMock.unitOfMeasure.findUnique.mockResolvedValue({
        id: 2,
        type: 'weight',
      });

      prismaMock.recipe.update.mockResolvedValue(updatedRecipe);

      await expect(
        service.updateRecipes({
          ingredients: [
            { id: 1, ingredientId: 8, unitId: 2, quantity: 0.5 },
          ],
        }),
      ).resolves.toEqual([updatedRecipe]);

      expect(prismaMock.ingredient.findUnique).toHaveBeenCalledWith({
        where: { id: 8 },
        include: { unit: true },
      });

      expect(prismaMock.unitOfMeasure.findUnique).toHaveBeenCalledWith({
        where: { id: 2 },
      });

      expect(prismaMock.recipe.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { ingredientId: 8, unitId: 2, quantity: 0.5 },
      });
    });

    it('preserves an explicitly provided zero quantity', async () => {
      prismaMock.recipe.update.mockResolvedValue({
        id: 1,
        quantity: new Prisma.Decimal(0),
      });

      await service.updateRecipes({
        ingredients: [{ id: 1, quantity: 0 }],
      });

      expect(prismaMock.recipe.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantity: 0 },
      });
    });

    it('updates multiple recipes and returns all results', async () => {
      const first = { id: 1, quantity: new Prisma.Decimal(100) };
      const second = { id: 2, quantity: new Prisma.Decimal(200) };

      prismaMock.recipe.update
        .mockResolvedValueOnce(first)
        .mockResolvedValueOnce(second);

      await expect(
        service.updateRecipes({
          ingredients: [
            { id: 1, quantity: 100 },
            { id: 2, quantity: 200 },
          ],
        }),
      ).resolves.toEqual([first, second]);

      expect(prismaMock.recipe.update).toHaveBeenCalledTimes(2);
      expect(prismaMock.recipe.update).toHaveBeenNthCalledWith(1, {
        where: { id: 1 },
        data: { quantity: 100 },
      });
      expect(prismaMock.recipe.update).toHaveBeenNthCalledWith(2, {
        where: { id: 2 },
        data: { quantity: 200 },
      });
    });

    it('throws when the recipe does not exist', async () => {
      prismaMock.recipe.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRecipes({
          ingredients: [{ id: 1, quantity: 100 }],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prismaMock.ingredient.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.recipe.update).not.toHaveBeenCalled();
    });

    it('throws when the ingredient does not exist', async () => {
      prismaMock.ingredient.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRecipes({
          ingredients: [{ id: 1, ingredientId: 99 }],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prismaMock.unitOfMeasure.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.recipe.update).not.toHaveBeenCalled();
    });

    it('throws when the unit does not exist', async () => {
      prismaMock.unitOfMeasure.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRecipes({
          ingredients: [{ id: 1, unitId: 99 }],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prismaMock.recipe.update).not.toHaveBeenCalled();
    });

    it('rejects a unit with an incompatible type', async () => {
      prismaMock.unitOfMeasure.findUnique.mockResolvedValue({
        id: 3,
        type: 'volume',
      });

      await expect(
        service.updateRecipes({
          ingredients: [{ id: 1, unitId: 3 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prismaMock.recipe.update).not.toHaveBeenCalled();
    });

    it('propagates update errors', async () => {
      const error = new Error('Recipe update failed');
      prismaMock.recipe.update.mockRejectedValue(error);

      await expect(
        service.updateRecipes({
          ingredients: [{ id: 1, quantity: 100 }],
        }),
      ).rejects.toBe(error);
    });
  });

  describe('deleteRecipes', () => {
    it('deletes the selected recipes and returns their previous data', async () => {
      const recipes = [
        { id: 1, itemId: 10 },
        { id: 2, itemId: 10 },
      ];

      prismaMock.recipe.findMany.mockResolvedValue(recipes);
      prismaMock.recipe.deleteMany.mockResolvedValue({ count: 2 });

      await expect(service.deleteRecipes([1, 2])).resolves.toEqual(recipes);

      expect(prismaMock.recipe.findMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
      });

      expect(prismaMock.recipe.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
      });
    });

    it('returns an empty array when no selected recipes exist', async () => {
      prismaMock.recipe.findMany.mockResolvedValue([]);
      prismaMock.recipe.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.deleteRecipes([99])).resolves.toEqual([]);
    });

    it('does not delete recipes when the initial query fails', async () => {
      const error = new Error('Database query failed');
      prismaMock.recipe.findMany.mockRejectedValue(error);

      await expect(service.deleteRecipes([1])).rejects.toBe(error);

      expect(prismaMock.recipe.deleteMany).not.toHaveBeenCalled();
    });

    it('propagates deletion errors', async () => {
      const error = new Error('Recipe deletion failed');
      prismaMock.recipe.findMany.mockResolvedValue([{ id: 1 }]);
      prismaMock.recipe.deleteMany.mockRejectedValue(error);

      await expect(service.deleteRecipes([1])).rejects.toBe(error);
    });
  });
});
