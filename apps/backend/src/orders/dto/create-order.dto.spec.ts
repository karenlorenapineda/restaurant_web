import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { OrderType } from '@prisma/client';
import { CreateOrderDto } from './create-order.dto';

describe('CreateOrderDto', () => {
  it('rejects an empty items array', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      type: OrderType.takeaway,
      items: [],
    });

    const errors = await validate(dto);
    const itemsError = errors.find((error) => error.property === 'items');

    expect(itemsError?.constraints?.arrayMinSize).toBe(
      'Order must contain at least one item.',
    );
  });

  it('accepts an order containing a valid item', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      type: OrderType.takeaway,
      items: [
        {
          itemId: 1,
          quantity: 1,
        },
      ],
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });
});