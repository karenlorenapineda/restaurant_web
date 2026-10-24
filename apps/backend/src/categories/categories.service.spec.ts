import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const prismaMock = {
    menuCategory: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('getCategories', () => {
    it('returns the categories from the database', async () => {
      const categories = [
        { id: 1, name: 'Entrantes', description: 'Para empezar' },
        { id: 2, name: 'Postres', description: null },
      ];

      prismaMock.menuCategory.findMany.mockResolvedValue(categories);

      const result = await service.getCategories();

      expect(result).toEqual(categories);
      expect(prismaMock.menuCategory.findMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.menuCategory.findMany).toHaveBeenCalledWith();
    });

    it('devuelve una lista vacía cuando no hay categorías', async () => {
      prismaMock.menuCategory.findMany.mockResolvedValue([]);

      await expect(service.getCategories()).resolves.toEqual([]);
    });

    it('propagates the error when the query fails', async () => {
      const error = new Error('Database error');

      prismaMock.menuCategory.findMany.mockRejectedValue(error);

      await expect(service.getCategories()).rejects.toBe(error);
    });
  });
});
