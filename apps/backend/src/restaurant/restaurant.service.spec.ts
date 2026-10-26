import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { RestaurantService } from './restaurant.service';

describe('RestaurantService', () => {
  let service: RestaurantService;

  const prismaMock = {
    restaurant: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<RestaurantService>(RestaurantService);
  });

  describe('getRestaurants', () => {
    it('returns restaurants from the database', async () => {
      const restaurants = [
        {
          id: 1,
          name: 'Picasso',
          address: '10 Main Street',
          isActive: true,
        },
        {
          id: 2,
          name: 'Picasso North',
          address: '20 North Street',
          isActive: false,
        },
      ];

      prismaMock.restaurant.findMany.mockResolvedValue(restaurants);

      await expect(service.getRestaurants()).resolves.toEqual(restaurants);

      expect(prismaMock.restaurant.findMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.restaurant.findMany).toHaveBeenCalledWith();
    });

    it('returns an empty array when no restaurants exist', async () => {
      prismaMock.restaurant.findMany.mockResolvedValue([]);

      await expect(service.getRestaurants()).resolves.toEqual([]);
    });

    it('propagates database errors', async () => {
      const error = new Error('Restaurant query failed');
      prismaMock.restaurant.findMany.mockRejectedValue(error);

      await expect(service.getRestaurants()).rejects.toBe(error);
    });
  });
});
