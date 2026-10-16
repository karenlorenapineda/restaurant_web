import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  const categoriesServiceMock = {
    getCategories: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: categoriesServiceMock,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  describe('getCategories', () => {
    it('returns the categories provided by the service', async () => {
      const categories = [
        { id: 1, name: 'Entrantes', description: 'Para empezar' },
        { id: 2, name: 'Postres', description: null },
      ];

      categoriesServiceMock.getCategories.mockResolvedValue(categories);

      const result = await controller.getCategories();

      expect(result).toEqual(categories);
      expect(categoriesServiceMock.getCategories).toHaveBeenCalledTimes(1);
      expect(categoriesServiceMock.getCategories).toHaveBeenCalledWith();
    });

    it('returns an empty list when the service finds no categories', async () => {
      categoriesServiceMock.getCategories.mockResolvedValue([]);

      await expect(controller.getCategories()).resolves.toEqual([]);
    });

    it('propagates the service errors', async () => {
      const error = new Error('Error querying categories');

      categoriesServiceMock.getCategories.mockRejectedValue(error);

      await expect(controller.getCategories()).rejects.toBe(error);
    });
  });
});
