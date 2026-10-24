import { BadRequestException } from '@nestjs/common';
import { Prisma, UnitOfMeasure } from '@prisma/client';

export function convertQuantity(
  amount: Prisma.Decimal,
  fromUnit: UnitOfMeasure,
  toUnit: UnitOfMeasure,
): Prisma.Decimal {
  if (fromUnit.type !== toUnit.type) {
    throw new BadRequestException(
      `Cannot convert between incompatible units: '${fromUnit.name}' and '${toUnit.name}'`,
    );
  }

  if (
    !fromUnit.baseFactor.isFinite() ||
    !toUnit.baseFactor.isFinite() ||
    fromUnit.baseFactor.lte(0) ||
    toUnit.baseFactor.lte(0)
  ) {
    throw new BadRequestException(
      'Unit conversion factors must be finite and greater than zero',
    );
  }

  if (fromUnit.id === toUnit.id) {
    return amount;
  }

  return amount.mul(fromUnit.baseFactor).div(toUnit.baseFactor);
}