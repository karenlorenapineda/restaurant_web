import { Test, TestingModule } from '@nestjs/testing';
import { SuppliesController } from './supplies.controller';
import { SuppliesService } from './supplies.service';

describe('SuppliesController', () => {
  let controller: SuppliesController;

  const suppliesServiceMock = {
    getIngredients: jest.fn(),
    createIngredient: jest.fn(),
    updateIngredient: jest.fn(),
    deleteIngredient: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliesController],
      providers: [
        {
          provide: SuppliesService,
          useValue: suppliesServiceMock,
        },
      ],
    }).compile();

    controller = module.get<SuppliesController>(SuppliesController);
  });

  describe('getIngredients', () => {
    it('returns ingredients from the service', async () => {
      const ingredients = [
        {
          id: 1,
          const: '$1.500 COP',
          name: 'Flour',
          stock: '500',
          threshold: '100',
          unit: 'g',
        },
      ];

      suppliesServiceMock.getIngredients.mockResolvedValue(ingredients);

      await expect(controller.getIngredients()).resolves.toEqual(
        ingredients,
      );

      expect(suppliesServiceMock.getIngredients).toHaveBeenCalledTimes(1);
      expect(suppliesServiceMock.getIngredients).toHaveBeenCalledWith();
    });

    it('returns an empty array when the service returns no ingredients', async () => {
      suppliesServiceMock.getIngredients.mockResolvedValue([]);

      await expect(controller.getIngredients()).resolves.toEqual([]);
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to fetch ingredients');
      suppliesServiceMock.getIngredients.mockRejectedValue(error);

      await expect(controller.getIngredients()).rejects.toBe(error);
    });
  });

  describe('createIngredient', () => {
    it('passes creation data to the service and returns its result', async () => {
      const data = {
        name: 'Flour',
        unitId: 1,
        unitCost: 1500,
        currentStock: 500,
        minimumStock: 100,
      };
      const ingredient = { id: 1, ...data };

      suppliesServiceMock.createIngredient.mockResolvedValue(ingredient);

      await expect(controller.createIngredient(data)).resolves.toEqual(
        ingredient,
      );

      expect(suppliesServiceMock.createIngredient).toHaveBeenCalledTimes(1);
      expect(suppliesServiceMock.createIngredient).toHaveBeenCalledWith(
        data,
      );
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to create ingredient');
      suppliesServiceMock.createIngredient.mockRejectedValue(error);

      await expect(
        controller.createIngredient({
          name: 'Flour',
          unitId: 1,
          unitCost: 1500,
        }),
      ).rejects.toBe(error);
    });
  });

  describe('updateIngredient', () => {
    it('passes the ingredient ID and update data to the service', async () => {
      const data = { currentStock: 250 };
      const ingredient = { id: 7, ...data };

      suppliesServiceMock.updateIngredient.mockResolvedValue(ingredient);

      await expect(
        controller.updateIngredient(7, data),
      ).resolves.toEqual(ingredient);

      expect(suppliesServiceMock.updateIngredient).toHaveBeenCalledTimes(1);
      expect(suppliesServiceMock.updateIngredient).toHaveBeenCalledWith(
        7,
        data,
      );
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to update ingredient');
      suppliesServiceMock.updateIngredient.mockRejectedValue(error);

      await expect(
        controller.updateIngredient(7, { currentStock: 250 }),
      ).rejects.toBe(error);
    });
  });

  describe('deleteIngredient', () => {
    it('passes the ingredient ID and returns the deleted ingredient', async () => {
      const ingredient = { id: 7, name: 'Flour' };

      suppliesServiceMock.deleteIngredient.mockResolvedValue(ingredient);

      await expect(controller.deleteIngredient(7)).resolves.toEqual(
        ingredient,
      );

      expect(suppliesServiceMock.deleteIngredient).toHaveBeenCalledTimes(1);
      expect(suppliesServiceMock.deleteIngredient).toHaveBeenCalledWith(7);
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to delete ingredient');
      suppliesServiceMock.deleteIngredient.mockRejectedValue(error);

      await expect(controller.deleteIngredient(7)).rejects.toBe(error);
    });
  });
});