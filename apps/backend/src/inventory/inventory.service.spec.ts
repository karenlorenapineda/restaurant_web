import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

describe('InventoryController', () => {
  let controller: InventoryController;

  const inventoryServiceMock = {
    getInventoryItems: jest.fn(),
    createInventoryItem: jest.fn(),
    updateInventoryItem: jest.fn(),
    deleteInventoryItem: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        {
          provide: InventoryService,
          useValue: inventoryServiceMock,
        },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
  });

  describe('getInventoryItems', () => {
    it('returns inventory items from the service', async () => {
      const items = [
        {
          id: 1,
          const: '$1.500 COP',
          name: 'Paper cups',
          stock: '50',
          threshold: '10',
          unit: 'ud',
        },
      ];

      inventoryServiceMock.getInventoryItems.mockResolvedValue(items);

      await expect(controller.getInventoryItems()).resolves.toEqual(items);

      expect(
        inventoryServiceMock.getInventoryItems,
      ).toHaveBeenCalledTimes(1);
      expect(
        inventoryServiceMock.getInventoryItems,
      ).toHaveBeenCalledWith();
    });

    it('returns an empty array when the service returns no items', async () => {
      inventoryServiceMock.getInventoryItems.mockResolvedValue([]);

      await expect(controller.getInventoryItems()).resolves.toEqual([]);
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to fetch inventory');
      inventoryServiceMock.getInventoryItems.mockRejectedValue(error);

      await expect(controller.getInventoryItems()).rejects.toBe(error);
    });
  });

  describe('createInventoryItem', () => {
    it('passes creation data to the service and returns its result', async () => {
      const data = {
        name: 'Paper cups',
        unitId: 1,
        unitCost: 1500,
        currentStock: 50,
        minimumStock: 10,
      };
      const item = { id: 1, ...data };

      inventoryServiceMock.createInventoryItem.mockResolvedValue(item);

      await expect(
        controller.createInventoryItem(data),
      ).resolves.toEqual(item);

      expect(
        inventoryServiceMock.createInventoryItem,
      ).toHaveBeenCalledTimes(1);
      expect(
        inventoryServiceMock.createInventoryItem,
      ).toHaveBeenCalledWith(data);
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to create inventory item');
      inventoryServiceMock.createInventoryItem.mockRejectedValue(error);

      await expect(
        controller.createInventoryItem({
          name: 'Paper cups',
          unitId: 1,
          unitCost: 1500,
        }),
      ).rejects.toBe(error);
    });
  });

  describe('updateInventoryItem', () => {
    it('passes the item ID and update data to the service', async () => {
      const data = { currentStock: 25 };
      const item = { id: 7, ...data };

      inventoryServiceMock.updateInventoryItem.mockResolvedValue(item);

      await expect(
        controller.updateInventoryItem(7, data),
      ).resolves.toEqual(item);

      expect(
        inventoryServiceMock.updateInventoryItem,
      ).toHaveBeenCalledTimes(1);
      expect(
        inventoryServiceMock.updateInventoryItem,
      ).toHaveBeenCalledWith(7, data);
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to update inventory item');
      inventoryServiceMock.updateInventoryItem.mockRejectedValue(error);

      await expect(
        controller.updateInventoryItem(7, { currentStock: 25 }),
      ).rejects.toBe(error);
    });
  });

  describe('deleteInventoryItem', () => {
    it('passes the item ID to the service and returns the deleted item', async () => {
      const item = { id: 7, name: 'Paper cups' };

      inventoryServiceMock.deleteInventoryItem.mockResolvedValue(item);

      await expect(
        controller.deleteInventoryItem(7),
      ).resolves.toEqual(item);

      expect(
        inventoryServiceMock.deleteInventoryItem,
      ).toHaveBeenCalledTimes(1);
      expect(
        inventoryServiceMock.deleteInventoryItem,
      ).toHaveBeenCalledWith(7);
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to delete inventory item');
      inventoryServiceMock.deleteInventoryItem.mockRejectedValue(error);

      await expect(
        controller.deleteInventoryItem(7),
      ).rejects.toBe(error);
    });
  });
});
