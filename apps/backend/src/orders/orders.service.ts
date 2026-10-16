import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from '../database/prisma.service';
import { OrderStatus, Prisma } from '@prisma/client';
import { convertQuantity } from '../common/utils/unit-conversion.util';
import { validateOrderType } from './orders.validator';
import { formatOrderResponse } from './orders.formatter';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
	[OrderStatus.queued]: [OrderStatus.preparing, OrderStatus.cancelled],
	[OrderStatus.preparing]: [OrderStatus.ready, OrderStatus.cancelled],
	[OrderStatus.ready]: [OrderStatus.completed, OrderStatus.cancelled],
	[OrderStatus.completed]: [],
	[OrderStatus.cancelled]: [],
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrders() {
    const orders = await this.prisma.order.findMany({
      orderBy: { orderDate: 'desc' },
      include: {
        table: true,
        orderDetails: {
          include: {
            item: true,
            modifications: {
              include: {
                recipe: {
                  include: { ingredient: true },
                },
              },
            },
          },
        },
      },
    });

    return orders.map((order) => formatOrderResponse(order));
  }

  async getOrder(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        orderDetails: {
          include: {
            item: true,
            modifications: {
              include: {
                recipe: {
                  include: { ingredient: true },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return formatOrderResponse(order);
  }

  async create(restaurantId: number, dto: CreateOrderDto, employeeId?: number) {
    if (!dto.items?.length) {
		throw new BadRequestException(
			'Order must contain at least one item.',
		);
	}
	validateOrderType(dto);

    if (dto.tableId) {
      const table = await this.prisma.table.findUnique({
        where: { id: dto.tableId },
      });
      if (!table) {
        throw new NotFoundException(`Table with ID ${dto.tableId} not found`);
      }
    }

    const uniqueItemIds = [...new Set(dto.items.map((i) => i.itemId))];
    const dbItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: uniqueItemIds },
        isAvailable: true,
      },
    });

    if (dbItems.length !== uniqueItemIds.length) {
      throw new BadRequestException('One or more items are invalid or unavailable');
    }

    const itemsMap = new Map(dbItems.map((item) => [item.id, item]));
    const allModRecipeIds = dto.items.flatMap(
      (item) => item.modifications?.map((mod) => mod.recipeId) ?? [],
    );

    if (allModRecipeIds.length > 0) {
      const dbRecipes = await this.prisma.recipe.findMany({
        where: { id: { in: allModRecipeIds } },
      });

      const recipesMap = new Map(dbRecipes.map((recipe) => [recipe.id, recipe]));

      for (const itemDto of dto.items) {
        for (const modification of itemDto.modifications ?? []) {
          const recipe = recipesMap.get(modification.recipeId);
          if (!recipe || recipe.itemId !== itemDto.itemId) {
            throw new BadRequestException(
              `Recipe ${modification.recipeId} is not valid for item ${itemDto.itemId}`,
            );
          }
        }
      }
    }

    let total = new Prisma.Decimal(0);

    const orderDetailsData = dto.items.map((itemDto) => {
      const dbItem = itemsMap.get(itemDto.itemId)!;
      const subtotal = dbItem.price.mul(itemDto.quantity);
      total = total.add(subtotal);

      return {
        itemId: itemDto.itemId,
        quantity: itemDto.quantity,
        unitPrice: dbItem.price,
        notes: itemDto.notes,
        modifications: itemDto.modifications?.length
          ? {
              create: itemDto.modifications.map((modification) => ({
                recipeId: modification.recipeId,
              })),
            }
          : undefined,
      };
    });

    return this.prisma.$transaction((tx) =>
      tx.order.create({
        data: {
          restaurantId,
          employeeId,
          tableId: dto.tableId,
          type: dto.type,
          status: OrderStatus.queued,
          customerName: dto.customerName,
          customerAddress: dto.customerAddress,
          customerPhone: dto.customerPhone,
          total,
          orderDetails: {
            create: orderDetailsData,
          },
          statusHistory: {
            create: {
              status: OrderStatus.queued,
            },
          },
        },
        include: {
          orderDetails: {
            include: {
              modifications: {
                include: {
                  recipe: {
                    include: { ingredient: true },
                  },
                },
              },
            },
          },
          statusHistory: true,
        },
      }),
    );
  }

  async updateOrderStatus(id: number, newStatus: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderDetails: {
          include: {
            modifications: true,
            item: {
              include: {
                recipes: {
                  include: {
                    unit: true,
                    ingredient: {
                      include: { unit: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot change order status from '${order.status}' to '${newStatus}'`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
		const claimedOrder = await tx.order.updateMany({
			where: {
				id,
				status: order.status,
			},
			data: {
				status: newStatus,
			},
		});

		if (claimedOrder.count !== 1) {
			throw new ConflictException(
				'The order status has already changed',
			);
		}

      if (newStatus === OrderStatus.preparing) {
        const stockDeductions = new Map<number, Prisma.Decimal>();

        for (const detail of order.orderDetails) {
          const excludedRecipeIds = new Set(
            detail.modifications.map((m) => m.recipeId),
          );

          for (const recipe of detail.item.recipes) {
            if (!excludedRecipeIds.has(recipe.id)) {
              const rawQuantity = recipe.quantity.mul(detail.quantity);

              const convertedQuantity = convertQuantity(
                rawQuantity,
                recipe.unit,
                recipe.ingredient.unit,
              );

              const currentTotal =
                stockDeductions.get(recipe.ingredientId) ?? new Prisma.Decimal(0);

              stockDeductions.set(
                recipe.ingredientId,
                currentTotal.add(convertedQuantity),
              );
            }
          }
        }

        for (const [ingredientId, quantityToDeduct] of stockDeductions.entries()) {
          await tx.ingredient.update({
            where: { id: ingredientId },
            data: {
              currentStock: {
                decrement: quantityToDeduct,
              },
            },
          });
        }
      }

		return tx.order.update({
			where: { id },
			data: {
				statusHistory: {
				create: { status: newStatus },
				},
			},
			include: { statusHistory: true },
		});
    });
  }
}
