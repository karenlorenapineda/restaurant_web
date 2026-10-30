/**
 * Safety check used by `prisma/seed-analytics-demo.ts`.
 *
 * The demo seed creates menu categories and dishes, and the menu module lists
 * every row of those tables, so running it against the shared development
 * database would put twelve demo dishes in the real menu. Therefore the seed
 * only runs against a database that is exclusively for demos/tests: its NAME
 * must contain "demo" or "test" (e.g. `picasso_demo`).
 */
export function getDatabaseName(databaseUrl: string): string | null {
  try {
    const name = decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//, ""));
    return name.length > 0 ? name : null;
  } catch {
    return null;
  }
}

export function assertDemoDatabase(
  databaseUrl: string | undefined,
  nodeEnv: string | undefined,
): string {
  if (nodeEnv === "production") {
    throw new Error("Refusing to seed demo data with NODE_ENV=production.");
  }

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  const name = getDatabaseName(databaseUrl);

  if (!name || !/(demo|test)/i.test(name)) {
    throw new Error(
      `Refusing to seed demo data into database "${name ?? "?"}": the demo seed ` +
        "adds dishes to the menu, so it only runs on a database whose name " +
        'contains "demo" or "test" (for example picasso_demo). Create one, run ' +
        "the migrations on it and point DATABASE_URL to it.",
    );
  }

  return name;
}
