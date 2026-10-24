import { PrismaClient, UnitType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {

  await prisma.userRole.createMany({
    data: [
      { name: 'Administrador', description: 'Control total de la plataforma y sucursales' },
      { name: 'Gerente', description: 'Gestión operativa, inventarios y personal' },
      { name: 'Camarero', description: 'Toma de pedidos y atención en salón' },
      { name: 'Cocinero', description: 'Visualización y despacho de comandas' },
    ],
    skipDuplicates: true,
  });


  await prisma.language.createMany({
    data: [
      { code: 'es', name: 'Español' },
      { code: 'en', name: 'English' },
    ],
    skipDuplicates: true,
  });


  await prisma.restaurant.createMany({
    data: [
      { name: 'Restaurante Picasso', address: 'Calle Gran Vía 42, Madrid', isActive: true },
    ],
    skipDuplicates: true,
  });


  await prisma.employeePosition.createMany({
    data: [
      { name: 'Chef Ejecutivo', description: 'Responsable de la preparación y control de cocina' },
      { name: 'Jefe de Sala', description: 'Supervisión del servicio a comensales' },
      { name: 'Mesero', description: 'Servicio en mesas y entrega de comandas' },
      { name: 'Bartender', description: 'Elaboración de bebidas y gestión de barra' },
      { name: 'Cajero', description: 'Cobro de facturas y arqueo de caja' },
    ],
    skipDuplicates: true,
  });

 
  await prisma.menuCategory.createMany({
    data: [
      { name: 'Entrantes', description: 'Tapas, aperitivos y entrantes para compartir' },
      { name: 'Platos Principales', description: 'Carnes, pescados, pastas y especialidades' },
      { name: 'Guarniciones', description: 'Acompañamientos y raciones complementarias' },
      { name: 'Bebidas', description: 'Refrescos, aguas, cervezas y vinos' },
      { name: 'Postres', description: 'Postres artesanales y dulces' },
    ],
    skipDuplicates: true,
  });


  await prisma.unitOfMeasure.createMany({
    data: [
	  { abbreviation: 'g', name: 'Gramo', type: UnitType.weight, baseFactor: 1 },
   	  { abbreviation: 'kg', name: 'Kilogramo', type: UnitType.weight, baseFactor: 1000 },
	  { abbreviation: 'ml', name: 'Mililitro', type: UnitType.volume, baseFactor: 1 },
      { abbreviation: 'l', name: 'Litro', type: UnitType.volume, baseFactor: 1000 },
	  { abbreviation: 'ud', name: 'Unidad', type: UnitType.count, baseFactor: 1 },
      { abbreviation: 'doc', name: 'Docena', type: UnitType.count, baseFactor: 12 },
    ],
    skipDuplicates: true,
  });


  await prisma.table.createMany({
    data: [
      { tableNumber: 'M-01', capacity: 2 },
      { tableNumber: 'M-02', capacity: 2 },
      { tableNumber: 'M-03', capacity: 4 },
      { tableNumber: 'M-04', capacity: 4 },
      { tableNumber: 'M-05', capacity: 6 },
      { tableNumber: 'M-06', capacity: 8 },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    // process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });