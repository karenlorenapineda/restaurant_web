import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}
  getTables() {
    return this.prisma.table.findMany({
      select: { id: true, tableNumber: true, capacity: true },
      orderBy: [{ tableNumber: "asc" }, { id: "asc" }],
    });
  }
}
