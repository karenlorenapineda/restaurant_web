import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';

describe('RestaurantController', () => {
  let controller: RestaurantController;

  const restaurantServiceMock = {
    getRestaurants: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestaurantController],
      providers: [
        {
          provide: RestaurantService,
          useValue: restaurantServiceMock,
        },
      ],
    }).compile();

    controller = module.get<RestaurantController>(RestaurantController);
  });

  describe('getRestaurants', () => {
    it('returns restaurants provided by the service', async () => {
      const restaurants = [
        {
          id: 1,
          name: 'Picasso',
          address: '10 Main Street',
          isActive: true,
        },
      ];

      restaurantServiceMock.getRestaurants.mockResolvedValue(restaurants);

      await expect(controller.getRestaurants()).resolves.toEqual(
        restaurants,
      );

      expect(
        restaurantServiceMock.getRestaurants,
      ).toHaveBeenCalledTimes(1);
      expect(
        restaurantServiceMock.getRestaurants,
      ).toHaveBeenCalledWith();
    });

    it('returns an empty array when the service returns no restaurants', async () => {
      restaurantServiceMock.getRestaurants.mockResolvedValue([]);

      await expect(controller.getRestaurants()).resolves.toEqual([]);
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to fetch restaurants');
      restaurantServiceMock.getRestaurants.mockRejectedValue(error);

      await expect(controller.getRestaurants()).rejects.toBe(error);
    });
  });
});
