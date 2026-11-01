import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { TablesController } from "./tables.controller";
import { TablesService } from "./tables.service";
import { EmployeesController } from "../employees/employees.controller";
import { EmployeesService } from "../employees/employees.service";

describe("read-only employee and table catalogs", () => {
  let app: INestApplication;
  const positions = jest.fn();
  const tables = jest.fn();
  beforeEach(async () => {
    positions.mockReset();
    tables.mockReset();
    const module = await Test.createTestingModule({
      controllers: [TablesController, EmployeesController],
      providers: [
        TablesService,
        EmployeesService,
        {
          provide: PrismaService,
          useValue: {
            employeePosition: { findMany: positions },
            table: { findMany: tables },
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    await app.listen(0, "127.0.0.1");
  });
  afterEach(async () => {
    await app.close();
  });
  it("serves positions without fetching user account information", async () => {
    positions.mockResolvedValue([{ id: 9, name: "Sala" }]);
    const response = await fetch(
      `${await app.getUrl()}/api/employees/positions`,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: 9, name: "Sala" }]);
    expect(positions).toHaveBeenCalledWith({
      select: { id: true, name: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  });
  it("serves table IDs, display numbers and capacity without order history", async () => {
    tables.mockResolvedValue([
      { id: 42, tableNumber: "Terraza 7", capacity: 4 },
    ]);
    const response = await fetch(`${await app.getUrl()}/api/tables`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { id: 42, tableNumber: "Terraza 7", capacity: 4 },
    ]);
    expect(tables).toHaveBeenCalledWith({
      select: { id: true, tableNumber: true, capacity: true },
      orderBy: [{ tableNumber: "asc" }, { id: "asc" }],
    });
  });
  it("returns empty catalogs rather than inventing records", async () => {
    tables.mockResolvedValue([]);
    positions.mockResolvedValue([]);
    for (const path of ["tables", "employees/positions"]) {
      const response = await fetch(`${await app.getUrl()}/api/${path}`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([]);
    }
  });
});
