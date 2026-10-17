import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, UnitType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UnitsService } from './units.service';

describe('UnitsService', () => {
	let service: UnitsService;

	const prismaMock = {
		unitOfMeasure: {
			findMany: jest.fn(),
		},
	};

	beforeEach(async () => {
		jest.resetAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UnitsService,
				{
					provide: PrismaService,
					useValue: prismaMock,
				},
			],
		}).compile();

		service = module.get<UnitsService>(UnitsService);
	});

	describe('getUnits', () => {
		it('returns the units along with their conversion factors', async () => {
			const units = [
				{
					id: 1,
					abbreviation: 'g',
					name: 'Gramo',
					type: UnitType.weight,
					baseFactor: new Prisma.Decimal(1),
				},
				{
					id: 2,
					abbreviation: 'kg',
					name: 'Kilogramo',
					type: UnitType.weight,
					baseFactor: new Prisma.Decimal(1000),
				},
			];

			prismaMock.unitOfMeasure.findMany.mockResolvedValue(units);

			const result = await service.getUnits();

			expect(result).toEqual(units);
			expect(prismaMock.unitOfMeasure.findMany).toHaveBeenCalledTimes(1);
			expect(prismaMock.unitOfMeasure.findMany).toHaveBeenCalledWith();
		});

		it('returns an empty list when there are no units', async () => {
			prismaMock.unitOfMeasure.findMany.mockResolvedValue([]);

			await expect(service.getUnits()).resolves.toEqual([]);
		});

		it('propagates the error when the query fails', async () => {
			const error = new Error('Database error');

			prismaMock.unitOfMeasure.findMany.mockRejectedValue(error);

			await expect(service.getUnits()).rejects.toBe(error);
		});
	});
});