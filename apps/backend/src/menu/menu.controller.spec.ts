
import { Test, TestingModule } from '@nestjs/testing';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

describe('MenuController', () => {
	let controller: MenuController;

	const menuService = {
		getMenuSections: jest.fn(),
		getFeaturedMenuItems: jest.fn(),
		getManagementMenuData: jest.fn(),
		createMenuItem: jest.fn(),
		updateMenuItem: jest.fn(),
		deleteMenuItem: jest.fn(),
	};

	beforeEach(async () => {
		jest.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			controllers: [MenuController],
			providers: [
				{
					provide: MenuService,
					useValue: menuService,
				},
			],
		}).compile();

		controller = module.get<MenuController>(MenuController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	it('returns the menu sections', async () => {
		const expected = [{ title: 'Hamburguesas', items: [] }];

		menuService.getMenuSections.mockResolvedValue(expected);

		const result = await controller.getMenuSections();

		expect(menuService.getMenuSections).toHaveBeenCalledTimes(1);
		expect(result).toEqual(expected);
	});

	it('returns the featured menu items', async () => {
		const expected = [{ id: 1, name: 'Hamburguesa' }];
		menuService.getFeaturedMenuItems.mockResolvedValue(expected);

		const result = await controller.getFeaturedMenuItems();

		expect(menuService.getFeaturedMenuItems).toHaveBeenCalledTimes(1);
		expect(result).toEqual(expected);
	});

	it('returns the management menu data', async () => {
		const expected = [{ id: 1, name: 'Hamburguesa', active: true }];
		menuService.getManagementMenuData.mockResolvedValue(expected);

		const result = await controller.getManagementMenuData();

		expect(menuService.getManagementMenuData).toHaveBeenCalledTimes(1);
		expect(result).toEqual(expected);
	});

	it('creates a menu item', async () => {
		const newDish = { name: 'Hamburguesa', price: 12 };
		const expected = { id: 1, ...newDish };
		menuService.createMenuItem.mockResolvedValue(expected);

		const result = await controller.createMenuItem(newDish as any);

		expect(menuService.createMenuItem).toHaveBeenCalledWith(newDish);
		expect(result).toEqual(expected);
	});

	it('updates a menu item', async () => {
		const updateData = { name: 'Hamburguesa especial' };
		const expected = { id: 1, ...updateData };
		menuService.updateMenuItem.mockResolvedValue(expected);

		const result = await controller.updateMenuItem(1, updateData);

		expect(menuService.updateMenuItem).toHaveBeenCalledWith(1, updateData);
		expect(result).toEqual(expected);
	});

	it('deletes a menu item', async () => {
		const expected = { id: 1, name: 'Hamburguesa' };
		menuService.deleteMenuItem.mockResolvedValue(expected);

		const result = await controller.deleteMenuItem(1);

		expect(menuService.deleteMenuItem).toHaveBeenCalledWith(1);
		expect(result).toEqual(expected);
	});

});
