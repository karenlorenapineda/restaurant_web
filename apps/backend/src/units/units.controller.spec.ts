import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, UnitType } from '@prisma/client';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';

describe('UnitsController', () => {
	let controller: UnitsController;

	const unitsServiceMock = {
		getUnits: jest.fn(),
	};

	beforeEach(async () => {
		jest.resetAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			controllers: [UnitsController],
			providers: [
				{
					provide: UnitsService,
					useValue: unitsServiceMock,
				},
			],
		}).compile();

		controller = module.get<UnitsController>(UnitsController);
	});

	describe('getUnits', () => {
		it('returns the units provided by the service.', async () => {
			const units = [
				{
					id: 2,
					abbreviation: 'kg',
					name: 'Kilogramo',
					type: UnitType.weight,
					baseFactor: new Prisma.Decimal(1000),
				},
			];

			unitsServiceMock.getUnits.mockResolvedValue(units);

			const result = await controller.getUnits();

			expect(result).toEqual(units);
			expect(unitsServiceMock.getUnits).toHaveBeenCalledTimes(1);
			expect(unitsServiceMock.getUnits).toHaveBeenCalledWith();
		});

		it('returns an empty list when the service finds no units', async () => {
			unitsServiceMock.getUnits.mockResolvedValue([]);

			await expect(controller.getUnits()).resolves.toEqual([]);
		});

		it('propagates the service errors', async () => {
			const error = new Error('Error al consultar las unidades');

			unitsServiceMock.getUnits.mockRejectedValue(error);

			await expect(controller.getUnits()).rejects.toBe(error);
		});
	});
});