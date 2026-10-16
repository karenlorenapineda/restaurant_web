import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MenuService } from './menu.service';
import { PrismaService } from '../database/prisma.service';

describe('MenuService', () => {
	let service: MenuService;

	const tx = {
		menuItem: {
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		recipe: {
			findUnique: jest.fn(),
			createMany: jest.fn(),
			update: jest.fn(),
			deleteMany: jest.fn(),
		},
		ingredient: {
			findUnique: jest.fn(),
		},
		unitOfMeasure: {
			findUnique: jest.fn(),
		},
	};

	const prisma = {
		$transaction: jest.fn(),
		menuCategory: {
			findMany: jest.fn(),
		},
		menuItem: {
			findMany: jest.fn(),
			create: jest.fn(),
			findUnique: jest.fn(),
		},
	};

	beforeEach(async () => {
		jest.resetAllMocks();

		tx.ingredient.findUnique.mockResolvedValue({
			id: 5,
			name: 'Flour',
			unit: { type: 'weight' },
		});

		tx.unitOfMeasure.findUnique.mockResolvedValue({
			id: 1,
			type: 'weight',
		});

		prisma.$transaction.mockImplementation(
			(callback) => callback(tx),
		);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MenuService,
				{ provide: PrismaService, useValue: prisma },
			],
		}).compile();

		service = module.get<MenuService>(MenuService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	it('deactivates a dish that has orders', async () => {
		const dish = {
			id: 1,
			recipes: [{ id: 10 }],
			orderDetails: [{ id: 20 }],
		};

		tx.menuItem.findUnique.mockResolvedValue(dish);
		tx.menuItem.update.mockResolvedValue({
			...dish,
			isAvailable: false,
		});

		const result = await service.deleteMenuItem(1);

		expect(tx.menuItem.update).toHaveBeenCalledWith({
			where: { id: 1 },
			data: { isAvailable: false },
			include: { recipes: true },
		});

		expect(tx.recipe.deleteMany).not.toHaveBeenCalled();
		expect(tx.menuItem.delete).not.toHaveBeenCalled();
		expect(result.isAvailable).toBe(false);
	});

	it('deletes a dish and its recipes when it has no orders', async () => {
		const dish = {
			id: 2,
			recipes: [{ id: 11 }],
			orderDetails: [],
		};

		tx.menuItem.findUnique.mockResolvedValue(dish);
		tx.recipe.deleteMany.mockResolvedValue({ count: 1 });
		tx.menuItem.delete.mockResolvedValue({ id: 2 });

		const result = await service.deleteMenuItem(2);

		expect(tx.recipe.deleteMany).toHaveBeenCalledWith({
			where: { itemId: 2 },
		});

		expect(tx.menuItem.delete).toHaveBeenCalledWith({
			where: { id: 2 },
		});

		expect(tx.menuItem.update).not.toHaveBeenCalled();
		expect(result).toEqual({ id: 2 });
	});
	it('throws NotFoundException when the dish does not exist', async () => {
		tx.menuItem.findUnique.mockResolvedValue(null);

		await expect(service.deleteMenuItem(999)).rejects.toThrow(
			NotFoundException,
		);

		expect(tx.recipe.deleteMany).not.toHaveBeenCalled();
		expect(tx.menuItem.delete).not.toHaveBeenCalled();
	});
	it('does not delete the dish if deleting recipes fails', async () => {
		const dish = {
			id: 3,
			recipes: [{ id: 12 }],
			orderDetails: [],
		};

		tx.menuItem.findUnique.mockResolvedValue(dish);
		tx.recipe.deleteMany.mockRejectedValue(
			new Error('FK constraint'),
		);

		await expect(service.deleteMenuItem(3)).rejects.toThrow(
			'FK constraint',
		);

		expect(tx.menuItem.delete).not.toHaveBeenCalled();
	});

	it('returns menu sections with formatted prices', async () => {
		const categories = [
			{
				id: 1,
				name: 'Hamburguesas',
				items: [
					{
						id: 10,
						name: 'Hamburguesa',
						description: 'Con queso',
						price: 12,
					},
				],
			},
		];

		const expected = [
			{
				title: 'Hamburguesas',
				items: [
					{
						id: 10,
						name: 'Hamburguesa',
						description: 'Con queso',
						price: '$12 COP',
					},
				],
			},
		];

		prisma.menuCategory.findMany.mockResolvedValue(categories);

		const result = await service.getMenuSections();

		expect(prisma.menuCategory.findMany).toHaveBeenCalledWith({
			include: { items: true },
		});

		expect(result).toEqual(expected);
	});

	it('returns only featured and available menu items', async () => {
		const dishes = [
			{
				id: 1,
				name: 'Hamburguesa',
				description: 'Con queso',
				price: 12,
				imageUrl: 'burger.jpg',
			},
		];

		prisma.menuItem.findMany.mockResolvedValue(dishes);

		const result = await service.getFeaturedMenuItems();

		expect(prisma.menuItem.findMany).toHaveBeenCalledWith({
			where: {
				isFavorite: true,
				isAvailable: true,
			},
		});

		expect(result).toEqual([
			{
				id: 1,
				name: 'Hamburguesa',
				description: 'Con queso',
				price: '$12 COP',
				image: 'burger.jpg',
			},
		]);
	});

	it('returns menu management data with mapped fields', async () => {
		const dishes = [
			{
				id: 1,
				name: 'Hamburguesa',
				description: 'Con queso',
				price: 12,
				imageUrl: 'burger.jpg',
				isAvailable: true,
				isFavorite: true,
				showImageInGallery: false,
				internalRecipe: 'Preparación interna',
				category: {
					name: 'Platos principales',
				},
			},
		];

		prisma.menuItem.findMany.mockResolvedValue(dishes);

		const result = await service.getManagementMenuData();

		expect(prisma.menuItem.findMany).toHaveBeenCalledWith({
			include: {
				category: true,
			},
		});

		expect(result).toEqual([
			{
				id: 1,
				name: 'Hamburguesa',
				category: 'Platos principales',
				description: 'Con queso',
				price: '$12 COP',
				image: 'burger.jpg',
				active: true,
				featured: true,
				showImage: false,
				recipe: 'Preparación interna',
			},
		]);
	});

	it('creates a menu item without ingredients', async () => {
		const data = {
			name: 'Hamburguesa',
			description: 'Con queso',
			price: 12,
			categoryId: 1,
		};

		const newDish = {
			id: 10,
			...data,
		};

		const expected = {
			...newDish,
			recipes: [],
		};

		tx.menuItem.create.mockResolvedValue(newDish);
		tx.menuItem.findUnique.mockResolvedValue(expected);

		const result = await service.createMenuItem(data);

		expect(tx.menuItem.create).toHaveBeenCalledWith({
			data,
		});
		expect(tx.menuItem.findUnique).toHaveBeenCalledWith({
			where: { id: 10 },
			include: { recipes: true },
		});

		expect(result).toEqual(expected);
	});


	it('creates a menu item with ingredients', async () => {
		const ingredients = [
			{
				ingredientId: 5,
				quantity: 2,
				unitId: 1,
			},
		];

		const data = {
			name: 'Hamburguesa',
			description: 'Con queso',
			price: 12,
			categoryId: 1,
			ingredients,
		};

		const newDish = {
			id: 10,
			name: 'Hamburguesa',
			description: 'Con queso',
			price: 12,
			categoryId: 1,
		};

		const expected = {
			...newDish,
			recipes: [{ id: 20, itemId: 10 }],
		};

		tx.menuItem.create.mockResolvedValue(newDish);
		tx.menuItem.findUnique.mockResolvedValue(expected);
		tx.recipe.createMany.mockResolvedValue({ count: 1 });

		const result = await service.createMenuItem(data as any);

		expect(tx.recipe.createMany).toHaveBeenCalledWith({
			data: ingredients.map((ingredient) => ({
				itemId: 10,
				ingredientId: ingredient.ingredientId,
				quantity: ingredient.quantity,
				unitId: ingredient.unitId,
			})),
		});
		expect(tx.menuItem.findUnique).toHaveBeenCalledWith({
			where: { id: 10 },
			include: { recipes: true },
		});

		expect(result).toEqual(expected);
	});


	it('propagates an error when creating recipes fails', async () => {
		const ingredients = [
			{ ingredientId: 5, quantity: 2, unitId: 1 },
		];

		const data = {
			name: 'Hamburguesa',
			description: 'Con queso',
			price: 12,
			categoryId: 1,
			ingredients,
		};

		const newDish = {
			id: 10,
			name: 'Hamburguesa',
			description: 'Con queso',
			price: 12,
			categoryId: 1,
		};

		tx.menuItem.create.mockResolvedValue(newDish);
		tx.recipe.createMany.mockRejectedValue(
			new Error('Recipe creation failed'),
		);
		await expect(service.createMenuItem(data as any))
			.rejects.toThrow('Recipe creation failed');

		expect(tx.menuItem.create).toHaveBeenCalledTimes(1);
		expect(tx.menuItem.findUnique).not.toHaveBeenCalled();
	});

	it('rejects incompatible units before creating a dish', async () => {
		tx.unitOfMeasure.findUnique.mockResolvedValue({
			id: 3,
			type: 'volume',
		});

		await expect(
			service.createMenuItem({
				name: 'Pizza',
				price: 25000,
				categoryId: 1,
				ingredients: [
					{ ingredientId: 5, quantity: 100, unitId: 3 },
				],
			}),
		).rejects.toBeInstanceOf(BadRequestException);

		expect(tx.menuItem.create).not.toHaveBeenCalled();
		expect(tx.recipe.createMany).not.toHaveBeenCalled();
	});

	it('rejects a missing ingredient before creating a dish', async () => {
		tx.ingredient.findUnique.mockResolvedValue(null);

		await expect(
			service.createMenuItem({
				name: 'Pizza',
				price: 25000,
				categoryId: 1,
				ingredients: [
					{ ingredientId: 99, quantity: 100, unitId: 1 },
				],
			}),
		).rejects.toBeInstanceOf(NotFoundException);

		expect(tx.menuItem.create).not.toHaveBeenCalled();
	});

	it('rejects a missing unit before creating a dish', async () => {
		tx.unitOfMeasure.findUnique.mockResolvedValue(null);

		await expect(
			service.createMenuItem({
				name: 'Pizza',
				price: 25000,
				categoryId: 1,
				ingredients: [
					{ ingredientId: 5, quantity: 100, unitId: 99 },
				],
			}),
		).rejects.toBeInstanceOf(NotFoundException);

		expect(tx.menuItem.create).not.toHaveBeenCalled();
	});

	it('updates a dish and its recipes using the transaction client', async () => {
		const expected = {
			id: 10,
			name: 'Updated pizza',
			recipes: [{ id: 20, quantity: 300 }],
		};

		tx.menuItem.findUnique
			.mockResolvedValueOnce({ id: 10 })
			.mockResolvedValueOnce(expected);

		tx.recipe.findUnique.mockResolvedValue({
			id: 20,
			itemId: 10,
			ingredientId: 5,
			unitId: 1,
		});

		await expect(
			service.updateMenuItem(10, {
				name: 'Updated pizza',
				ingredients: [{ id: 20, quantity: 300 }],
			}),
		).resolves.toEqual(expected);

		expect(prisma.$transaction).toHaveBeenCalledTimes(1);

		expect(tx.menuItem.update).toHaveBeenCalledWith({
			where: { id: 10 },
			data: { name: 'Updated pizza' },
		});

		expect(tx.recipe.update).toHaveBeenCalledWith({
			where: { id: 20 },
			data: { quantity: 300 },
		});
	});

	it('rejects recipes belonging to another dish before writing', async () => {
		tx.menuItem.findUnique.mockResolvedValue({ id: 10 });

		tx.recipe.findUnique.mockResolvedValue({
			id: 20,
			itemId: 99,
			ingredientId: 5,
			unitId: 1,
		});

		await expect(
			service.updateMenuItem(10, {
				name: 'Updated pizza',
				ingredients: [{ id: 20, quantity: 300 }],
			}),
		).rejects.toBeInstanceOf(NotFoundException);

		expect(tx.menuItem.update).not.toHaveBeenCalled();
		expect(tx.recipe.update).not.toHaveBeenCalled();
	});

	it('rejects incompatible recipe updates before changing the dish', async () => {
		tx.menuItem.findUnique.mockResolvedValue({ id: 10 });

		tx.recipe.findUnique.mockResolvedValue({
			id: 20,
			itemId: 10,
			ingredientId: 5,
			unitId: 1,
		});

		tx.unitOfMeasure.findUnique.mockResolvedValue({
			id: 3,
			type: 'volume',
		});

		await expect(
			service.updateMenuItem(10, {
				name: 'Updated pizza',
				ingredients: [{ id: 20, unitId: 3 }],
			}),
		).rejects.toBeInstanceOf(BadRequestException);

		expect(tx.menuItem.update).not.toHaveBeenCalled();
		expect(tx.recipe.update).not.toHaveBeenCalled();
	});

	it('rejects an update when the dish does not exist', async () => {
		tx.menuItem.findUnique.mockResolvedValue(null);

		await expect(
			service.updateMenuItem(99, { name: 'Updated pizza' }),
		).rejects.toBeInstanceOf(NotFoundException);

		expect(tx.menuItem.update).not.toHaveBeenCalled();
	});

	it('propagates recipe update failures from the transaction', async () => {
		const error = new Error('Recipe update failed');

		tx.menuItem.findUnique.mockResolvedValue({ id: 10 });

		tx.recipe.findUnique.mockResolvedValue({
			id: 20,
			itemId: 10,
			ingredientId: 5,
			unitId: 1,
		});

		tx.recipe.update.mockRejectedValue(error);

		await expect(
			service.updateMenuItem(10, {
				ingredients: [{ id: 20, quantity: 300 }],
			}),
		).rejects.toBe(error);

		expect(prisma.$transaction).toHaveBeenCalledTimes(1);
	});
});
