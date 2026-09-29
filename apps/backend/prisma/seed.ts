import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAYS_OF_HISTORY = 60;
const ORDERS_PER_DAY_MIN = 3;
const ORDERS_PER_DAY_MAX = 12;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

async function main() {
  console.log("Seeding demo data for the analytics dashboard...");

  const role = await prisma.userRole.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "waiter", description: "Restaurant floor staff" },
  });

  const language = await prisma.language.upsert({
    where: { id: 1 },
    update: {},
    create: { code: "es", name: "Spanish" },
  });

  const position = await prisma.employeePosition.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "Waiter", description: "Takes and serves orders" },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "Picasso Demo Restaurant", address: "Calle Ficticia 1, Madrid" },
  });

  const user = await prisma.user.upsert({
    where: { email: "demo.waiter@picasso.local" },
    update: {},
    create: {
      email: "demo.waiter@picasso.local",
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

  const table = await prisma.table.upsert({
    where: { id: 1 },
    update: {},
    create: { tableNumber: "T1", capacity: 4 },
  });

  const statusNames = ["pending", "preparing", "served", "paid", "cancelled"];
  const statuses = await Promise.all(
    statusNames.map((name, index) =>
      prisma.orderStatus.upsert({
        where: { id: index + 1 },
        update: {},
        create: { name },
      }),
    ),
  );
  const activeStatuses = statuses.filter((s) => s.name !== "cancelled");

  const methodNames = ["cash", "credit_card", "debit_card", "mobile_wallet"];
  const paymentMethods = await Promise.all(
    methodNames.map((name, index) =>
      prisma.paymentMethod.upsert({
        where: { id: index + 1 },
        update: {},
        create: { name },
      }),
    ),
  );

  const categories = await Promise.all(
    [
      { name: "Starters" },
      { name: "Main courses" },
      { name: "Desserts" },
      { name: "Drinks" },
    ].map((category, index) =>
      prisma.menuCategory.upsert({
        where: { id: index + 1 },
        update: {},
        create: category,
      }),
    ),
  );

  const menuItemsSeed = [
    { name: "Patatas bravas", price: 6.5, categoryId: categories[0].id },
    { name: "Croquetas de jamón", price: 7.9, categoryId: categories[0].id },
    { name: "Ensalada César", price: 8.5, categoryId: categories[0].id },
    { name: "Paella valenciana", price: 14.9, categoryId: categories[1].id },
    { name: "Solomillo a la plancha", price: 18.5, categoryId: categories[1].id },
    { name: "Hamburguesa Picasso", price: 12.9, categoryId: categories[1].id },
    { name: "Pasta al pesto", price: 11.5, categoryId: categories[1].id },
    { name: "Tarta de queso", price: 5.9, categoryId: categories[2].id },
    { name: "Tiramisú", price: 6.2, categoryId: categories[2].id },
    { name: "Agua mineral", price: 2.2, categoryId: categories[3].id },
    { name: "Refresco", price: 2.8, categoryId: categories[3].id },
    { name: "Copa de vino", price: 4.5, categoryId: categories[3].id },
  ];

  const menuItems = [];
  for (const item of menuItemsSeed) {
    const existing = await prisma.menuItem.findFirst({ where: { name: item.name } });
    menuItems.push(
      existing ??
        (await prisma.menuItem.create({
          data: { ...item, price: item.price.toFixed(2) },
        })),
    );
  }

  // Wipe previously seeded orders so the script is safely re-runnable.
  await prisma.payment.deleteMany({ where: { order: { restaurantId: restaurant.id } } });
  await prisma.orderDetail.deleteMany({ where: { order: { restaurantId: restaurant.id } } });
  await prisma.order.deleteMany({ where: { restaurantId: restaurant.id } });

  const now = new Date();
  let ordersCreated = 0;

  for (let dayOffset = DAYS_OF_HISTORY; dayOffset >= 0; dayOffset--) {
    const day = new Date(now);
    day.setDate(day.getDate() - dayOffset);

    const ordersToday = randomInt(ORDERS_PER_DAY_MIN, ORDERS_PER_DAY_MAX);

    for (let i = 0; i < ordersToday; i++) {
      const orderDate = new Date(day);
      orderDate.setHours(randomInt(11, 22), randomInt(0, 59), 0, 0);

      const status = dayOffset === 0 ? pick(statuses) : pick(activeStatuses);
      const lineItemCount = randomInt(1, 4);
      const chosenItems = Array.from({ length: lineItemCount }, () => pick(menuItems));

      const total = chosenItems.reduce((sum, item) => sum + Number(item.price), 0);

      const order = await prisma.order.create({
        data: {
          restaurantId: restaurant.id,
          tableId: table.id,
          employeeId: employee.id,
          statusId: status.id,
          orderDate,
          total: total.toFixed(2),
          orderDetails: {
            create: chosenItems.map((item) => ({
              itemId: item.id,
              quantity: 1,
              unitPrice: item.price,
            })),
          },
        },
      });

      if (status.name === "paid") {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            paymentMethodId: pick(paymentMethods).id,
            amount: total.toFixed(2),
            paymentDate: orderDate,
          },
        });
      }

      ordersCreated += 1;
    }
  }

  console.log(`Done. Created ${ordersCreated} demo orders for restaurant #${restaurant.id}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
