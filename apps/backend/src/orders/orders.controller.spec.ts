import { OrderType, OrderStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
	let controller: OrdersController;
	let ordersService: {
		getOrders: jest.Mock;
		getOrder: jest.Mock;
		create: jest.Mock;
		updateOrderStatus: jest.Mock;
	};

	beforeEach(async () => {
		ordersService = {
			getOrders: jest.fn(),
			getOrder: jest.fn(),
			create: jest.fn(),
			updateOrderStatus: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [OrdersController],
			providers: [
				{
					provide: OrdersService,
					useValue: ordersService,
				},
			],
		}).compile();

		controller = module.get<OrdersController>(OrdersController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('getOrders', () => {
		it('should call the service and return its result', async () => {
			const orders = [{ id: 1 }, { id: 2 }];
			ordersService.getOrders.mockResolvedValue(orders);

			await expect(controller.getOrders()).resolves.toEqual(orders);
			expect(ordersService.getOrders).toHaveBeenCalledTimes(1);
		});
	});

	describe('getOrder', () => {
		it('should call the service with the order ID', async () => {
			const order = { id: 5 };
			ordersService.getOrder.mockResolvedValue(order);

			await expect(controller.getOrder(5)).resolves.toEqual(order);
			expect(ordersService.getOrder).toHaveBeenCalledWith(5);
		});
	});

	describe('createOrder', () => {
		it('should pass the user session and DTO to the service', async () => {
			const user = {
				userId: 30,
				email: 'test@example.com',
				restaurantId: 10,
				employeeId: 20,
			};

			const dto = {
				type: OrderType.takeaway,
				items: [
					{
						itemId: 1,
						quantity: 2,
					},
				],
			};

			const createdOrder = { id: 1 };

			ordersService.create.mockResolvedValue(createdOrder);

			await expect(
				controller.createOrder(user, dto),
			).resolves.toEqual(createdOrder);

			expect(ordersService.create).toHaveBeenCalledWith(
				10,
				dto,
				20,
			);
		});
	});


	describe('updateOrderStatus', () => {
		it('should pass the order ID and new status to the service', async () => {
			const result = {
				id: 1,
				status: OrderStatus.preparing,
			};

			ordersService.updateOrderStatus.mockResolvedValue(result);

			await expect(
				controller.updateOrderStatus(1, {
					status: OrderStatus.preparing,
				}),
			).resolves.toEqual(result);

			expect(ordersService.updateOrderStatus).toHaveBeenCalledWith(
				1,
				OrderStatus.preparing,
			);
		});
	});

});
