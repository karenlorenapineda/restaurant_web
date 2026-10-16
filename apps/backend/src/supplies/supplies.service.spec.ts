import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { SuppliesService } from './supplies.service';

describe('SuppliesService', () => {
  let service: SuppliesService;

  const prismaMock = {
    ingredient: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const makePrismaError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('Database operation failed', {
      code,
      clientVersion: 'test',
    });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<SuppliesService>(SuppliesService);
  });

  describe('getIngredients', () => {
    it('formats ingredients for the response', async () => {
      prismaMock.ingredient.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Flour',
          unitCost: new Prisma.Decimal(1500),
          currentStock: new Prisma.Decimal('25.5'),
          minimumStock: new Prisma.Decimal(10),
          unit: { abbreviation: 'g' },
        },
        {
          id: 2,
          name: 'Sugar',
          unitCost: new Prisma.Decimal(0),
          currentStock: new Prisma.Decimal(0),
          minimumStock: new Prisma.Decimal(0),
          unit: { abbreviation: 'g' },
        },
      ]);

      await expect(service.getIngredients()).resolves.toEqual([
        {
          id: 1,
          const: '$1.500 COP',
          name: 'Flour',
          stock: '25.5',
          threshold: '10',
          unit: 'g',
        },
        {
          id: 2,
          const: '$0 COP',
          name: 'Sugar',
          stock: '0',
          threshold: '0',
          unit: 'g',
        },
      ]);

      expect(prismaMock.ingredient.findMany).toHaveBeenCalledWith({
        include: { unit: true },
      });
    });

    it('returns an empty array when no ingredients exist', async () => {
      prismaMock.ingredient.findMany.mockResolvedValue([]);

      await expect(service.getIngredients()).resolves.toEqual([]);
    });

    it('propagates database errors', async () => {
      const error = new Error('Database query failed');
      prismaMock.ingredient.findMany.mockRejectedValue(error);

      await expect(service.getIngredients()).rejects.toBe(error);
    });
  });

  describe('createIngredient', () => {
    it('creates an ingredient and returns the saved record', async () => {
      const data = {
        name: 'Flour',
        unitId: 1,
        unitCost: 1500,
        currentStock: 500,
        minimumStock: 100,
      };
      const savedIngredient = { id: 1, ...data };

      prismaMock.ingredient.create.mockResolvedValue(savedIngredient);

      await expect(service.createIngredient(data)).resolves.toEqual(
        savedIngredient,
      );

      expect(prismaMock.ingredient.create).toHaveBeenCalledWith({
        data,
      });
    });

    it('omits unspecified stock fields from the creation data', async () => {
      const data = {
        name: 'Flour',
        unitId: 1,
        unitCost: 1500,
      };

      prismaMock.ingredient.create.mockResolvedValue({
        id: 1,
        ...data,
        currentStock: new Prisma.Decimal(0),
        minimumStock: new Prisma.Decimal(0),
      });

      await service.createIngredient(data);

      expect(prismaMock.ingredient.create).toHaveBeenCalledWith({
        data: {
          name: 'Flour',
          unitId: 1,
          unitCost: 1500,
        },
      });
    });

    it('propagates creation errors', async () => {
      const error = new Error('Ingredient creation failed');
      prismaMock.ingredient.create.mockRejectedValue(error);

      await expect(
        service.createIngredient({
          name: 'Flour',
          unitId: 1,
          unitCost: 1500,
        }),
      ).rejects.toBe(error);
    });
  });

  describe('updateIngredient', () => {
    it('updates only the provided fields for the specified ingredient', async () => {
      const data = { name: 'Whole wheat flour' };
      const savedIngredient = { id: 7, ...data };

      prismaMock.ingredient.update.mockResolvedValue(savedIngredient);

      await expect(
        service.updateIngredient(7, data),
      ).resolves.toEqual(savedIngredient);

      expect(prismaMock.ingredient.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { name: 'Whole wheat flour' },
      });
    });

    it('preserves explicitly provided zero values', async () => {
      const data = {
        unitCost: 0,
        currentStock: 0,
        minimumStock: 0,
      };

      prismaMock.ingredient.update.mockResolvedValue({
        id: 7,
        ...data,
      });

      await service.updateIngredient(7, data);

      expect(prismaMock.ingredient.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data,
      });
    });

    it('converts a Prisma P2025 error into NotFoundException', async () => {
      prismaMock.ingredient.update.mockRejectedValue(
        makePrismaError('P2025'),
      );

      await expect(
        service.updateIngredient(99, { name: 'Flour' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('propagates other Prisma errors without converting them to 404', async () => {
      const error = makePrismaError('P2003');
      prismaMock.ingredient.update.mockRejectedValue(error);

      await expect(
        service.updateIngredient(7, { unitId: 99 }),
      ).rejects.toBe(error);
    });

    it('propagates unexpected errors', async () => {
      const error = new Error('Database connection failed');
      prismaMock.ingredient.update.mockRejectedValue(error);

      await expect(
        service.updateIngredient(7, { name: 'Flour' }),
      ).rejects.toBe(error);
    });
  });

  describe('deleteIngredient', () => {
    it('deletes the specified ingredient and returns its previous data', async () => {
      const ingredient = { id: 7, name: 'Flour' };

      prismaMock.ingredient.delete.mockResolvedValue(ingredient);

      await expect(service.deleteIngredient(7)).resolves.toEqual(
        ingredient,
      );

      expect(prismaMock.ingredient.delete).toHaveBeenCalledWith({
        where: { id: 7 },
      });
    });

    it('converts a Prisma P2025 error into NotFoundException', async () => {
      prismaMock.ingredient.delete.mockRejectedValue(
        makePrismaError('P2025'),
      );

      await expect(
        service.deleteIngredient(99),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('propagates foreign key errors when deletion is blocked', async () => {
      const error = makePrismaError('P2003');
      prismaMock.ingredient.delete.mockRejectedValue(error);

      await expect(service.deleteIngredient(7)).rejects.toBe(error);
    });

    it('propagates unexpected errors', async () => {
      const error = new Error('Database connection failed');
      prismaMock.ingredient.delete.mockRejectedValue(error);

      await expect(service.deleteIngredient(7)).rejects.toBe(error);
    });
  });
});
