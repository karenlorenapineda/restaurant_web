// Test fixtures only. No deletes and no writes outside the named integration DB.
const { PrismaClient } = require("@prisma/client");
if (
  new URL(process.env.DATABASE_URL || "http://invalid").pathname !==
  "/picasso_integration"
)
  throw new Error("Use only the disposable picasso_integration database");
const prisma = new PrismaClient();
async function main() {
  const data = await prisma.$transaction(async (tx) => {
    const role =
      (await tx.userRole.findUnique({ where: { id: 1 } })) ??
      (await tx.userRole.create({ data: { name: "Integration admin" } }));
    const language =
      (await tx.language.findUnique({ where: { id: 1 } })) ??
      (await tx.language.create({ data: { code: "es", name: "Español" } }));
    const restaurant =
      (await tx.restaurant.findUnique({ where: { id: 1 } })) ??
      (await tx.restaurant.create({
        data: {
          name: "Restaurante de integración",
          address: "Dirección de prueba",
        },
      }));
    const position =
      (await tx.employeePosition.findUnique({ where: { id: 1 } })) ??
      (await tx.employeePosition.create({ data: { name: "Sala" } }));
    const sender =
      (await tx.user.findUnique({ where: { id: 1 } })) ??
      (await tx.user.create({
        data: {
          email: "one@integration.local",
          roleId: role.id,
          languageId: language.id,
        },
      }));
    const receiver =
      (await tx.user.findUnique({ where: { id: 2 } })) ??
      (await tx.user.create({
        data: {
          email: "two@integration.local",
          roleId: role.id,
          languageId: language.id,
        },
      }));
    const employee =
      (await tx.employee.findUnique({ where: { id: 1 } })) ??
      (await tx.employee.create({
        data: {
          userId: sender.id,
          firstName: "Prueba",
          lastName: "Integración",
          restaurantId: restaurant.id,
          positionId: position.id,
        },
      }));
    const secondEmployee =
      (await tx.employee.findUnique({ where: { userId: receiver.id } })) ??
      (await tx.employee.create({
        data: {
          userId: receiver.id,
          firstName: "Equipo",
          lastName: "Integración",
          restaurantId: restaurant.id,
          positionId: position.id,
        },
      }));
    if (restaurant.id !== 1 || employee.id !== 1)
      throw new Error(
        "The current temporary backend session requires restaurant 1 and employee 1",
      );
    const category =
      (await tx.menuCategory.findFirst({ where: { name: "Integración" } })) ??
      (await tx.menuCategory.create({ data: { name: "Integración" } }));
    const unit =
      (await tx.unitOfMeasure.findFirst({
        where: { abbreviation: "g", type: "weight" },
      })) ??
      (await tx.unitOfMeasure.create({
        data: {
          abbreviation: "g",
          name: "Gramo",
          type: "weight",
          baseFactor: 1,
        },
      }));
    const ingredient =
      (await tx.ingredient.findFirst({
        where: { name: "Harina de prueba" },
      })) ??
      (await tx.ingredient.create({
        data: {
          name: "Harina de prueba",
          unitId: unit.id,
          unitCost: 1,
          currentStock: 5000,
          minimumStock: 100,
        },
      }));
    const dish =
      (await tx.menuItem.findFirst({ where: { name: "Pizza de prueba" } })) ??
      (await tx.menuItem.create({
        data: {
          name: "Pizza de prueba",
          description: "Plato de prueba para comprobar la integración",
          price: "25000.50",
          categoryId: category.id,
          imageUrl: "/images/Plato01.png",
          isFavorite: true,
          showImageInGallery: true,
          recipes: {
            create: {
              ingredientId: ingredient.id,
              quantity: 100,
              unitId: unit.id,
            },
          },
        },
      }));
    const table =
      (await tx.table.findUnique({ where: { id: 1 } })) ??
      (await tx.table.create({
        data: { tableNumber: "Prueba 1", capacity: 4 },
      }));
    return {
      restaurant: restaurant.id,
      employee: employee.id,
      secondEmployee: secondEmployee.id,
      sender: sender.id,
      receiver: receiver.id,
      position: position.id,
      table: table.id,
      dish: dish.id,
    };
  });
  console.log("Integration fixtures ready:", JSON.stringify(data));
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
