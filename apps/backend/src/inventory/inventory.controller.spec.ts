import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;

  const prismaMock = {
    inventoryItem: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const makeNotFoundError = () =>
    new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: 'test',
    });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  describe('getInventoryItems', () => {
    it('formats inventory items for the response', async () => {
      prismaMock.inventoryItem.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Paper cups',
          unitCost: new Prisma.Decimal(1500),
          currentStock: new Prisma.Decimal('25.5'),
          minimumStock: new Prisma.Decimal(10),
          unit: { abbreviation: 'ud' },
        },
        {
          id: 2,
          name: 'Napkins',
          unitCost: new Prisma.Decimal(0),
          currentStock: new Prisma.Decimal(0),
          minimumStock: new Prisma.Decimal(0),
          unit: { abbreviation: 'ud' },
        },
      ]);

      await expect(service.getInventoryItems()).resolves.toEqual([
        {
          id: 1,
          const: '$1.500 COP',
          name: 'Paper cups',
          stock: '25.5',
          threshold: '10',
          unit: 'ud',
        },
        {
          id: 2,
          const: '$0 COP',
          name: 'Napkins',
          stock: '0',
          threshold: '0',
          unit: 'ud',
        },
      ]);

      expect(prismaMock.inventoryItem.findMany).toHaveBeenCalledWith({
        include: { unit: true },
      });
    });

    it('returns an empty array when inventory is empty', async () => {
      prismaMock.inventoryItem.findMany.mockResolvedValue([]);

      await expect(service.getInventoryItems()).resolves.toEqual([]);
    });

    it('propagates database errors', async () => {
      const error = new Error('Database query failed');
      prismaMock.inventoryItem.findMany.mockRejectedValue(error);

      await expect(service.getInventoryItems()).rejects.toBe(error);
    });
  });

  describe('createInventoryItem', () => {
    it('creates an inventory item and returns the saved record', async () => {
      const data = {
        name: 'Paper cups',
        unitId: 1,
        unitCost: 1500,
        currentStock: 50,
        minimumStock: 10,
      };
      const savedItem = { id: 1, ...data };

      prismaMock.inventoryItem.create.mockResolvedValue(savedItem);

      await expect(service.createInventoryItem(data)).resolves.toEqual(
        savedItem,
      );

      expect(prismaMock.inventoryItem.create).toHaveBeenCalledWith({
        data,
      });
    });

    it('allows stock fields to be omitted so database defaults can apply', async () => {
      const data = {
        name: 'Paper cups',
        unitId: 1,
        unitCost: 1500,
      };

      prismaMock.inventoryItem.create.mockResolvedValue({
        id: 1,
        ...data,
        currentStock: new Prisma.Decimal(0),
        minimumStock: new Prisma.Decimal(0),
      });

      const result = await service.createInventoryItem(data);

      expect(prismaMock.inventoryItem.create).toHaveBeenCalledWith({
        data,
      });
      expect(result.currentStock.toString()).toBe('0');
      expect(result.minimumStock.toString()).toBe('0');
    });

    it('propagates creation errors', async () => {
      const error = new Error('Inventory creation failed');
      prismaMock.inventoryItem.create.mockRejectedValue(error);

      await expect(
        service.createInventoryItem({
          name: 'Paper cups',
          unitId: 1,
          unitCost: 1500,
        }),
      ).rejects.toBe(error);
    });
  });

  describe('updateInventoryItem', () => {
    it('updates only the provided fields for the specified item', async () => {
      const data = { name: 'Large paper cups' };
      const savedItem = { id: 7, ...data };

      prismaMock.inventoryItem.update.mockResolvedValue(savedItem);

      await expect(
        service.updateInventoryItem(7, data),
      ).resolves.toEqual(savedItem);

      expect(prismaMock.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { name: 'Large paper cups' },
      });
    });

    it('preserves explicitly provided zero values', async () => {
      const data = {
        unitCost: 0,
        currentStock: 0,
        minimumStock: 0,
      };

      prismaMock.inventoryItem.update.mockResolvedValue({
        id: 7,
        ...data,
      });

      await service.updateInventoryItem(7, data);

      expect(prismaMock.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: {
          unitCost: 0,
          currentStock: 0,
          minimumStock: 0,
        },
      });
    });

    it('converts a Prisma P2025 error into NotFoundException', async () => {
      prismaMock.inventoryItem.update.mockRejectedValue(
        makeNotFoundError(),
      );

      await expect(
        service.updateInventoryItem(99, { name: 'Paper cups' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('propagates other Prisma errors without converting them to 404', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: 'test',
        },
      );

      prismaMock.inventoryItem.update.mockRejectedValue(error);

      await expect(
        service.updateInventoryItem(7, { unitId: 99 }),
      ).rejects.toBe(error);
    });

    it('propagates unexpected errors', async () => {
      const error = new Error('Database connection failed');
      prismaMock.inventoryItem.update.mockRejectedValue(error);

      await expect(
        service.updateInventoryItem(7, { name: 'Paper cups' }),
      ).rejects.toBe(error);
    });
  });

  describe('deleteInventoryItem', () => {
    it('deletes the specified item and returns its previous data', async () => {
      const item = {
        id: 7,
        name: 'Paper cups',
      };

      prismaMock.inventoryItem.delete.mockResolvedValue(item);

      await expect(service.deleteInventoryItem(7)).resolves.toEqual(item);

      expect(prismaMock.inventoryItem.delete).toHaveBeenCalledWith({
        where: { id: 7 },
      });
    });

    it('converts a Prisma P2025 error into NotFoundException', async () => {
      prismaMock.inventoryItem.delete.mockRejectedValue(
        makeNotFoundError(),
      );

      await expect(
        service.deleteInventoryItem(99),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('propagates other Prisma errors without converting them to 404', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: 'test',
        },
      );

      prismaMock.inventoryItem.delete.mockRejectedValue(error);

      await expect(service.deleteInventoryItem(7)).rejects.toBe(error);
    });

    it('propagates unexpected errors', async () => {
      const error = new Error('Database connection failed');
      prismaMock.inventoryItem.delete.mockRejectedValue(error);

      await expect(service.deleteInventoryItem(7)).rejects.toBe(error);
    });
  });
});
