import { Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.categoriaMenu.findMany({
      include: {
        items: {
          orderBy: { nombre: "asc" },
          where: { disponible: true },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return categories.map((category) => ({
      id: category.id,
      title: category.nombre,
      description: category.descripcion,
      items: category.items.map((item) => ({
        id: item.id,
        name: item.nombre,
        description: item.descripcion ?? "",
        image: item.imagen,
        price: new Intl.NumberFormat("es-CO", {
          currency: "COP",
          maximumFractionDigits: 0,
          style: "currency",
        }).format(Number(item.precio)),
      })),
    }));
  }
}
