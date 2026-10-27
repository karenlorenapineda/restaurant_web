/**
 * Demo data for the analytics dashboard.
 *
 * SAFETY RULES (do not break them):
 *  - Everything this script creates hangs off ONE dedicated restaurant
 *    (DEMO_RESTAURANT_NAME). That restaurant is the ONLY thing it ever deletes
 *    data from; it never touches other restaurants' orders, payments, etc.
 *  - Lookup tables (roles, payment methods, categories, menu items...)
 *    are found by NAME and created only if missing. Nothing is deleted there and
 *    no fixed ids are assumed.
 *  - The wipe + re-creation of the demo orders runs inside a single transaction:
 *    if anything fails, the previous demo data is left exactly as it was.
 *  - It refuses to run with NODE_ENV=production unless ALLOW_DEMO_SEED=1.
 *
 * Run it with:  npm run seed:analytics --workspace @picasso/backend
 *
 * (It is independent from prisma/seed.ts, the general seed of the project.)
 */
import { OrderStatus, OrderType, Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_RESTAURANT_NAME = "[DEMO] Picasso Demo Restaurant";
const DEMO_USER_EMAIL = "demo.waiter@picasso.local";
const DEMO_TABLE_NUMBER = "DEMO-1";

const DAYS_OF_HISTORY = 60;
const ORDERS_PER_DAY_MIN = 3;
const ORDERS_PER_DAY_MAX = 12;
const CANCELLED_PROBABILITY = 0.08;

const PAYMENT_METHOD_NAMES = ["cash", "credit_card", "debit_card", "mobile_wallet"];

const MENU_SEED = [
  { name: "Patatas bravas", price: 6.5, category: "Starters" },
  { name: "Croquetas de jamón", price: 7.9, category: "Starters" },
  { name: "Ensalada César", price: 8.5, category: "Starters" },
  { name: "Paella valenciana", price: 14.9, category: "Main courses" },
  { name: "Solomillo a la plancha", price: 18.5, category: "Main courses" },
  { name: "Hamburguesa Picasso", price: 12.9, category: "Main courses" },
  { name: "Pasta al pesto", price: 11.5, category: "Main courses" },
  { name: "Tarta de queso", price: 5.9, category: "Desserts" },
  { name: "Tiramisú", price: 6.2, category: "Desserts" },
  { name: "Agua mineral", price: 2.2, category: "Drinks" },
  { name: "Refresco", price: 2.8, category: "Drinks" },
  { name: "Copa de vino", price: 4.5, category: "Drinks" },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: readonly T[]): T {
  const item = items[randomInt(0, items.length - 1)];
  if (item === undefined) {
    throw new Error("pick() called with an empty list");
  }
  return item;
}

/** Case-insensitive "find by name, otherwise create" for the lookup tables. */
const byName = (name: string) => ({
  name: { equals: name, mode: "insensitive" as const },
});

interface DemoLine {
  itemId: number;
  quantity: number;
  unitPrice: Prisma.Decimal;
}

interface DemoOrder {
  status: OrderStatus;
  isPaid: boolean;
  orderDate: Date;
  total: number;
  lines: DemoLine[];
}

async function ensureLookups() {
  const role =
    (await prisma.userRole.findFirst({ where: byName("waiter") })) ??
    (await prisma.userRole.create({
      data: { name: "waiter", description: "Restaurant floor staff" },
    }));

  const language =
    (await prisma.language.findFirst({ where: { code: "es" } })) ??
    (await prisma.language.create({ data: { code: "es", name: "Spanish" } }));

  const position =
    (await prisma.employeePosition.findFirst({ where: byName("Waiter") })) ??
    (await prisma.employeePosition.create({
      data: { name: "Waiter", description: "Takes and serves orders" },
    }));

  const restaurant =
    (await prisma.restaurant.findFirst({
      where: { name: DEMO_RESTAURANT_NAME },
    })) ??
    (await prisma.restaurant.create({
      data: { name: DEMO_RESTAURANT_NAME, address: "Calle Ficticia 1, Madrid" },
    }));

  const user = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: {
      email: DEMO_USER_EMAIL,
      roleId: role.id,
      languageId: language.id,
      emailVerified: true,
    },
  });

  const employee = await prisma.employee.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      firstName: "Demo",
      lastName: "Waiter",
      restaurantId: restaurant.id,
      positionId: position.id,
      birthDate: new Date("1995-01-01"),
    },
  });

  const table =
    (await prisma.table.findFirst({
      where: { tableNumber: DEMO_TABLE_NUMBER },
    })) ??
    (await prisma.table.create({
      data: { tableNumber: DEMO_TABLE_NUMBER, capacity: 4 },
    }));

  const paymentMethods = [];
  for (const name of PAYMENT_METHOD_NAMES) {
    paymentMethods.push(
      (await prisma.paymentMethod.findFirst({ where: byName(name) })) ??
        (await prisma.paymentMethod.create({ data: { name } })),
    );
  }

  const categoryIds = new Map<string, number>();
  for (const categoryName of new Set(MENU_SEED.map((m) => m.category))) {
    const category =
      (await prisma.menuCategory.findFirst({ where: byName(categoryName) })) ??
      (await prisma.menuCategory.create({ data: { name: categoryName } }));
    categoryIds.set(categoryName, category.id);
  }

  const menuItems = [];
  for (const seedItem of MENU_SEED) {
    const categoryId = categoryIds.get(seedItem.category);
    if (categoryId === undefined) {
      throw new Error(`Missing category ${seedItem.category}`);
    }
    menuItems.push(
      (await prisma.menuItem.findFirst({ where: byName(seedItem.name) })) ??
        (await prisma.menuItem.create({
          data: {
            name: seedItem.name,
            price: seedItem.price.toFixed(2),
            categoryId,
          },
        })),
    );
  }

  return { restaurant, employee, table, paymentMethods, menuItems };
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "1") {
    throw new Error(
      "Refusing to seed demo data with NODE_ENV=production (set ALLOW_DEMO_SEED=1 to override).",
    );
  }

  console.log("Seeding demo data for the analytics dashboard...");

  const { restaurant, employee, table, paymentMethods, menuItems } =
    await ensureLookups();

  // `Order.status` is the OrderStatus enum: queued | preparing | ready | completed | cancelled.
  // Past orders are mostly `completed` (paid); recent ones may still be open.
  const openStatuses: OrderStatus[] = [
    OrderStatus.queued,
    OrderStatus.preparing,
    OrderStatus.ready,
  ];

  // Build every demo order in memory first, so the transaction itself is short.
  const orders: DemoOrder[] = [];
  const now = new Date();

  for (let dayOffset = DAYS_OF_HISTORY; dayOffset >= 0; dayOffset--) {
    const ordersToday = randomInt(ORDERS_PER_DAY_MIN, ORDERS_PER_DAY_MAX);

    for (let i = 0; i < ordersToday; i++) {
      const orderDate = new Date(now);
      orderDate.setUTCDate(orderDate.getUTCDate() - dayOffset);
      orderDate.setUTCHours(randomInt(11, 22), randomInt(0, 59), 0, 0);

      // Cancelled orders appear on every day so the "not a sale" rule is exercised.
      const status: OrderStatus =
        Math.random() < CANCELLED_PROBABILITY
          ? OrderStatus.cancelled
          : dayOffset > 0 && Math.random() < 0.85
            ? OrderStatus.completed
            : pick([OrderStatus.completed, ...openStatuses]);

      const lines = Array.from({ length: randomInt(1, 4) }, (): DemoLine => {
        const item = pick(menuItems);
        return {
          itemId: item.id,
          quantity: randomInt(1, 3),
          unitPrice: item.price,
        };
      });

      const total = lines.reduce(
        (sum, line) => sum + Number(line.unitPrice) * line.quantity,
        0,
      );

      orders.push({
        status,
        isPaid: status === OrderStatus.completed,
        orderDate,
        total,
        lines,
      });
    }
  }

  // Wipe + recreate ONLY the demo restaurant's orders, atomically.
  const created = await prisma.$transaction(
    async (tx) => {
      const where = { order: { restaurantId: restaurant.id } };

      await tx.payment.deleteMany({ where });
      await tx.orderDetailModification.deleteMany({
        where: { orderDetail: { order: { restaurantId: restaurant.id } } },
      });
      await tx.orderDetail.deleteMany({ where });
      await tx.orderStatusHistory.deleteMany({ where });
      await tx.bill.deleteMany({ where });
      const removed = await tx.order.deleteMany({
        where: { restaurantId: restaurant.id },
      });
      console.log(`Removed ${removed.count} previous demo orders (restaurant #${restaurant.id}).`);

      for (const order of orders) {
        const row = await tx.order.create({
          data: {
            restaurantId: restaurant.id,
            tableId: table.id,
            employeeId: employee.id,
            status: order.status,
            type: OrderType.dine_in,
            orderDate: order.orderDate,
            total: order.total.toFixed(2),
            orderDetails: { create: order.lines },
          },
        });

        if (order.isPaid) {
          await tx.payment.create({
            data: {
              orderId: row.id,
              paymentMethodId: pick(paymentMethods).id,
              amount: order.total.toFixed(2),
              paymentDate: order.orderDate,
            },
          });
        }
      }

      return orders.length;
    },
    { timeout: 120_000, maxWait: 10_000 },
  );

  console.log(`Done. Created ${created} demo orders for restaurant #${restaurant.id}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
