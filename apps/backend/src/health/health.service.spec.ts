import { ServiceUnavailableException } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";
import { HealthService } from "./health.service";

describe("HealthService", () => {
  it("reports that PostgreSQL is available", async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
    } as unknown as PrismaService;
    const service = new HealthService(prisma);

    await expect(service.check()).resolves.toMatchObject({
      status: "ok",
      services: { database: "up" },
    });
  });

  it("returns a service unavailable error when PostgreSQL cannot be reached", async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error("database unavailable")),
    } as unknown as PrismaService;
    const service = new HealthService(prisma);

    await expect(service.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
