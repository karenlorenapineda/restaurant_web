import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { OrderStatus, Prisma, OrderType } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../database/prisma.service';

describe('OrdersService', () => {
	let service: OrdersService;
	let prismaMock: any;

	beforeEach(async () => {
		prismaMock = {
			order: {
				findUnique: jest.fn(),
				updateMany: jest.fn(),
				update: jest.fn(),
			},
			ingredient: {
				update: jest.fn(),
			},
		};

		prismaMock.$transaction = jest.fn((callback) =>
			callback(prismaMock),
		);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				OrdersService,
				{
					provide: PrismaService,
					useValue: prismaMock,
				},
			],
		}).compile();

		service = module.get<OrdersService>(OrdersService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('updateOrderStatus', () => {
		it('should throw ConflictException when the order status has already changed', async () => {
			prismaMock.order.findUnique.mockResolvedValue({
				id: 1,
				status: OrderStatus.queued,
				orderDetails: [],
			});

			prismaMock.order.updateMany.mockResolvedValue({
				count: 0,
			});

			await expect(
				service.updateOrderStatus(1, OrderStatus.preparing),
			).rejects.toThrow(ConflictException);

			expect(prismaMock.ingredient.update).not.toHaveBeenCalled();
			expect(prismaMock.order.update).not.toHaveBeenCalled();
		});
	});
	it('should deduct ingredients and record history when moving an order to preparing', async () => {
		prismaMock.order.findUnique.mockResolvedValue({
			id: 1,
			status: OrderStatus.queued,
			orderDetails: [],
		});

		prismaMock.order.updateMany.mockResolvedValue({
			count: 1,
		});

		prismaMock.order.update.mockResolvedValue({
			id: 1,
			statusHistory: [{ status: OrderStatus.preparing }],
		});

		const result = await service.updateOrderStatus(
			1,
			OrderStatus.preparing,
		);

		expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
			where: {
				id: 1,
				status: OrderStatus.queued,
			},
			data: {
				status: OrderStatus.preparing,
			},
		});

		expect(prismaMock.order.update).toHaveBeenCalledWith({
			where: { id: 1 },
			data: {
				statusHistory: {
					create: { status: OrderStatus.preparing },
				},
			},
			include: { statusHistory: true },
		});

		expect(result.statusHistory).toEqual([
			{ status: OrderStatus.preparing },
		]);
	});
	it('should deduct the correct ingredient quantity when moving an order to preparing', async () => {
		const unit = {
			id: 1,
			name: 'gram',
			type: 'weight',
			baseFactor: new Prisma.Decimal(1),
		};

		const recipe = {
			id: 10,
			ingredientId: 20,
			quantity: new Prisma.Decimal(50),
			unitId: 1,
			unit,
			ingredient: {
				id: 20,
				unit,
			},
		};

		prismaMock.order.findUnique.mockResolvedValue({
			id: 1,
			status: OrderStatus.queued,
			orderDetails: [
				{
					quantity: 2,
					modifications: [],
					item: {
						recipes: [recipe],
					},
				},
			],
		});

		prismaMock.order.updateMany.mockResolvedValue({ count: 1 });

		prismaMock.ingredient.update.mockResolvedValue({});
		prismaMock.order.update.mockResolvedValue({
			id: 1,
			statusHistory: [{ status: OrderStatus.preparing }],
		});

		await service.updateOrderStatus(1, OrderStatus.preparing);

		expect(prismaMock.ingredient.update).toHaveBeenCalledTimes(1);
		expect(prismaMock.ingredient.update).toHaveBeenCalledWith({
			where: { id: 20 },
			data: {
				currentStock: {
					decrement: new Prisma.Decimal(100),
				},
			},
		});
	});
	it('should not deduct ingredients excluded by order modifications', async () => {
		const unit = {
			id: 1,
			name: 'gram',
			type: 'weight',
			baseFactor: new Prisma.Decimal(1),
		};

		const recipe = {
			id: 10,
			ingredientId: 20,
			quantity: new Prisma.Decimal(50),
			unitId: 1,
			unit,
			ingredient: {
				id: 20,
				unit,
			},
		};

		prismaMock.order.findUnique.mockResolvedValue({
			id: 1,
			status: OrderStatus.queued,
			orderDetails: [
				{
					quantity: 2,
					modifications: [{ recipeId: 10 }],
					item: {
						recipes: [recipe],
					},
				},
			],
		});

		prismaMock.order.updateMany.mockResolvedValue({ count: 1 });
		prismaMock.order.update.mockResolvedValue({
			id: 1,
			statusHistory: [{ status: OrderStatus.preparing }],
		});

		await service.updateOrderStatus(1, OrderStatus.preparing);

		expect(prismaMock.ingredient.update).not.toHaveBeenCalled();
	});
	it('should not record order history if ingredient deduction fails', async () => {
		const unit = {
			id: 1,
			name: 'gram',
			type: 'weight',
			baseFactor: new Prisma.Decimal(1),
		};

		const recipe = {
			id: 10,
			ingredientId: 20,
			quantity: new Prisma.Decimal(50),
			unitId: 1,
			unit,
			ingredient: {
				id: 20,
				unit,
			},
		};

		prismaMock.order.findUnique.mockResolvedValue({
			id: 1,
			status: OrderStatus.queued,
			orderDetails: [
				{
					quantity: 2,
					modifications: [],
					item: {
						recipes: [recipe],
					},
				},
			],
		});

		prismaMock.order.updateMany.mockResolvedValue({ count: 1 });

		prismaMock.ingredient.update.mockRejectedValue(
			new Error('Database error'),
		);

		await expect(
			service.updateOrderStatus(1, OrderStatus.preparing),
		).rejects.toThrow('Database error');

		expect(prismaMock.order.update).not.toHaveBeenCalled();
	});

	describe('create', () => {
		it('rejects an empty order before starting a transaction', async () => {
			await expect(
				service.create(1, {
					type: OrderType.takeaway,
					items: [],
				}),
			).rejects.toThrow(
				new BadRequestException(
					'Order must contain at least one item.',
				),
			);

			expect(prismaMock.$transaction).not.toHaveBeenCalled();
		});
	});
});