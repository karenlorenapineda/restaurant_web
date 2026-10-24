import { Test, TestingModule } from '@nestjs/testing';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

describe('RecipesController', () => {
  let controller: RecipesController;

  const recipesServiceMock = {
    getRecipes: jest.fn(),
    getRecipesDish: jest.fn(),
    createRecipes: jest.fn(),
    updateRecipes: jest.fn(),
    deleteRecipes: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipesController],
      providers: [
        {
          provide: RecipesService,
          useValue: recipesServiceMock,
        },
      ],
    }).compile();

    controller = module.get<RecipesController>(RecipesController);
  });

  describe('getRecipes', () => {
    it('returns all recipes from the service', async () => {
      const result = {
        Pizza: { ingredients: [], recipe: 'Bake' },
      };

      recipesServiceMock.getRecipes.mockResolvedValue(result);

      await expect(controller.getRecipes()).resolves.toEqual(result);

      expect(recipesServiceMock.getRecipes).toHaveBeenCalledTimes(1);
      expect(recipesServiceMock.getRecipes).toHaveBeenCalledWith();
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to fetch recipes');
      recipesServiceMock.getRecipes.mockRejectedValue(error);

      await expect(controller.getRecipes()).rejects.toBe(error);
    });
  });

  describe('getRecipesDish', () => {
    it('passes the dish ID to the service and returns its result', async () => {
      recipesServiceMock.getRecipesDish.mockResolvedValue({});

      await expect(controller.getRecipesDish(10)).resolves.toEqual({});

      expect(recipesServiceMock.getRecipesDish).toHaveBeenCalledTimes(1);
      expect(recipesServiceMock.getRecipesDish).toHaveBeenCalledWith(10);
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to fetch dish recipes');
      recipesServiceMock.getRecipesDish.mockRejectedValue(error);

      await expect(controller.getRecipesDish(10)).rejects.toBe(error);
    });
  });

  describe('createRecipes', () => {
    it('passes the creation data to the service and returns its result', async () => {
      const data = {
        itemId: 10,
        ingredients: [
          { ingredientId: 1, quantity: 250, unitId: 1 },
        ],
      };

      recipesServiceMock.createRecipes.mockResolvedValue({ count: 1 });

      await expect(controller.createRecipes(data)).resolves.toEqual({
        count: 1,
      });

      expect(recipesServiceMock.createRecipes).toHaveBeenCalledTimes(1);
      expect(recipesServiceMock.createRecipes).toHaveBeenCalledWith(data);
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to create recipes');
      recipesServiceMock.createRecipes.mockRejectedValue(error);

      await expect(
        controller.createRecipes({
          itemId: 10,
          ingredients: [
            { ingredientId: 1, quantity: 250, unitId: 1 },
          ],
        }),
      ).rejects.toBe(error);
    });
  });

  describe('updateRecipes', () => {
    it('passes the update data to the service and returns its result', async () => {
      const data = {
        ingredients: [{ id: 1, quantity: 100 }],
      };
      const result = [{ id: 1, quantity: 100 }];

      recipesServiceMock.updateRecipes.mockResolvedValue(result);

      await expect(controller.updateRecipes(data)).resolves.toEqual(result);

      expect(recipesServiceMock.updateRecipes).toHaveBeenCalledTimes(1);
      expect(recipesServiceMock.updateRecipes).toHaveBeenCalledWith(data);
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to update recipes');
      recipesServiceMock.updateRecipes.mockRejectedValue(error);

      await expect(
        controller.updateRecipes({
          ingredients: [{ id: 1, quantity: 100 }],
        }),
      ).rejects.toBe(error);
    });
  });

  describe('deleteRecipes', () => {
    it('extracts the IDs and returns the deleted recipes', async () => {
      const result = [{ id: 1 }, { id: 2 }];

      recipesServiceMock.deleteRecipes.mockResolvedValue(result);

      await expect(
        controller.deleteRecipes({ ids: [1, 2] }),
      ).resolves.toEqual(result);

      expect(recipesServiceMock.deleteRecipes).toHaveBeenCalledTimes(1);
      expect(recipesServiceMock.deleteRecipes).toHaveBeenCalledWith([1, 2]);
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to delete recipes');
      recipesServiceMock.deleteRecipes.mockRejectedValue(error);

      await expect(
        controller.deleteRecipes({ ids: [1] }),
      ).rejects.toBe(error);
    });
  });
});