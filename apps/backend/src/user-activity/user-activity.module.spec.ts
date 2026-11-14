import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";

import { DatabaseModule } from "../database/database.module";
import { PrismaService } from "../database/prisma.service";
import { UserActivityModule } from "./user-activity.module";

/** Boots the real module (dependency injection, routes, validation pipe) with a fake database. */
describe("UserActivityModule over HTTP", () => {
  let app: INestApplication;
  let base: string;

  beforeAll(async () => {
    const prisma = {
      user: { count: jest.fn().mockResolvedValue(0) },
      chatMessage: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      friendship: { count: jest.fn().mockResolvedValue(0) },
      order: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, UserActivityModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await app.listen(0, "127.0.0.1");
    base = `${await app.getUrl()}/api/user-activity`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("answers the summary with the default range", async () => {
    const response = await fetch(`${base}/summary`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      totalUsers: 0,
      chatMessages: 0,
    });
  });

  it("answers the chart-ready lists as arrays", async () => {
    for (const path of [
      "signups-over-time",
      "chat-activity-over-time",
      "users-by-role",
      "top-active-users",
    ]) {
      const response = await fetch(`${base}/${path}`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([]);
    }
    const insights = await (await fetch(`${base}/insights`)).json();
    expect(Array.isArray(insights.insights)).toBe(true);
  });

  it.each([
    ["an impossible calendar day", "summary?from=2026-02-30"],
    ["an inverted range", "summary?from=2026-09-01&to=2026-08-01"],
    ["a limit above 50", "top-active-users?limit=51"],
    ["an unknown grouping", "signups-over-time?groupBy=year"],
    ["an unknown parameter", "summary?foo=1"],
    ["an unknown report", "export/csv?report=everything"],
  ])("rejects %s with 400", async (_name, path) => {
    expect((await fetch(`${base}/${path}`)).status).toBe(400);
  });

  it("downloads CSV and PDF", async () => {
    const csv = await fetch(`${base}/export/csv?report=summary`);
    expect(csv.status).toBe(200);
    expect(csv.headers.get("content-type")).toContain("text/csv");
    expect(csv.headers.get("content-disposition")).toContain("attachment");

    const pdf = await fetch(`${base}/export/pdf?report=insights`);
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get("content-type")).toContain("application/pdf");
    expect(
      Buffer.from(await pdf.arrayBuffer())
        .subarray(0, 4)
        .toString(),
    ).toBe("%PDF");
  });
});
