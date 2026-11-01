import { assertDemoDatabase, getDatabaseName } from "./demo-database.util";

const url = (db: string) =>
  `postgresql://picasso:secret@database:5432/${db}?schema=public`;

describe("demo seed database guard", () => {
  it("reads the database name from DATABASE_URL", () => {
    expect(getDatabaseName(url("picasso_demo"))).toBe("picasso_demo");
    expect(getDatabaseName("not a url")).toBeNull();
  });

  it.each(["picasso_demo", "picasso_test", "DEMO", "analytics-Test-1"])(
    "allows the dedicated database %s",
    (name) => {
      expect(assertDemoDatabase(url(name), "development")).toBe(name);
    },
  );

  it.each(["picasso", "restaurant", "prod_db"])(
    "refuses the shared database %s (it would add dishes to the real menu)",
    (name) => {
      expect(() => assertDemoDatabase(url(name), "development")).toThrow(
        /demo|test/,
      );
    },
  );

  it("refuses without DATABASE_URL, with an unreadable one and in production", () => {
    expect(() => assertDemoDatabase(undefined, "development")).toThrow();
    expect(() => assertDemoDatabase("garbage", "development")).toThrow();
    expect(() => assertDemoDatabase(url("picasso_demo"), "production")).toThrow(
      /production/,
    );
  });
});
