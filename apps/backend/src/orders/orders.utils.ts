import { BadRequestException } from '@nestjs/common';
import { Prisma, UnitOfMeasure } from '@prisma/client';

export function convertQuantity(
	amount: Prisma.Decimal,
	fromUnit: UnitOfMeasure,
	toUnit: UnitOfMeasure,
): Prisma.Decimal {
	
	if (fromUnit.id === toUnit.id) {
		return amount;
	}

	if (fromUnit.type !== toUnit.type) {
		throw new BadRequestException(
			`Cannot convert between incompatible units:'${fromUnit.name}' (${fromUnit.type}) y '${toUnit.name}' (${toUnit.type})`,
		);
	}

	return amount.mul(fromUnit.baseFactor).div(toUnit.baseFactor);
}