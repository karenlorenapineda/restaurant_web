import { BadRequestException } from '@nestjs/common';
import { Prisma, UnitOfMeasure, UnitType } from '@prisma/client';
import { convertQuantity } from './unit-conversion.util';

describe('convertQuantity', () => {
  const gram: UnitOfMeasure = {
    id: 1,
    name: 'Gram',
    abbreviation: 'g',
    type: UnitType.weight,
    baseFactor: new Prisma.Decimal(1),
  };

  const kilogram: UnitOfMeasure = {
    id: 2,
    name: 'Kilogram',
    abbreviation: 'kg',
    type: UnitType.weight,
    baseFactor: new Prisma.Decimal(1000),
  };

  it('converts kilograms to grams', () => {
    const result = convertQuantity(
      new Prisma.Decimal(1),
      kilogram,
      gram,
    );

    expect(result.toString()).toBe('1000');
  });

  it('converts grams to kilograms', () => {
    const result = convertQuantity(
      new Prisma.Decimal(250),
      gram,
      kilogram,
    );

    expect(result.toString()).toBe('0.25');
  });

  it('preserves quantities when the unit does not change', () => {
    const result = convertQuantity(
      new Prisma.Decimal('1.25'),
      kilogram,
      kilogram,
    );

    expect(result.toString()).toBe('1.25');
  });

  it('preserves zero quantities', () => {
    expect(
      convertQuantity(new Prisma.Decimal(0), gram, kilogram).toString(),
    ).toBe('0');
  });

  it('rejects incompatible unit types', () => {
    const liter: UnitOfMeasure = {
      id: 3,
      name: 'Liter',
      abbreviation: 'L',
      type: UnitType.volume,
      baseFactor: new Prisma.Decimal(1000),
    };

    expect(() =>
      convertQuantity(new Prisma.Decimal(1), kilogram, liter),
    ).toThrow(BadRequestException);
  });

  it.each(['0', '-1', 'NaN', 'Infinity'])(
    'rejects an invalid source factor: %s',
    (factor) => {
      const invalidUnit = {
        ...kilogram,
        baseFactor: new Prisma.Decimal(factor),
      };

      expect(() =>
        convertQuantity(new Prisma.Decimal(1), invalidUnit, gram),
      ).toThrow(BadRequestException);
    },
  );

  it.each(['0', '-1', 'NaN', 'Infinity'])(
    'rejects an invalid target factor: %s',
    (factor) => {
      const invalidUnit = {
        ...kilogram,
        baseFactor: new Prisma.Decimal(factor),
      };

      expect(() =>
        convertQuantity(new Prisma.Decimal(1), gram, invalidUnit),
      ).toThrow(BadRequestException);
    },
  );
});
