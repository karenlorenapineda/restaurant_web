import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, listRows } from "./client";
afterEach(() => vi.unstubAllGlobals());
describe("catalog response boundaries", () => {
  it.each([
    ["tables", [{ id: 42, tableNumber: "Terraza", capacity: 0 }]],
    ["tables", [{ id: 42, tableNumber: "Terraza", capacity: -1 }]],
    ["tables", [{ id: 42, tableNumber: "Terraza", capacity: 2.5 }]],
    ["tables", [{ id: 42, tableNumber: "Terraza", capacity: "4" }]],
    ["tables", [{ id: 42, capacity: 4 }]],
    ["tables", [{ id: "42", tableNumber: "Terraza", capacity: 4 }]],
    ["employees/positions", [{ id: 8 }]],
    ["employees/positions", [{ id: 0, name: "Sala" }]],
    ["employees/positions", { id: 8, name: "Sala" }],
  ] as const)("rejects malformed %s responses: %j", async (path, rows) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => rows }),
    );
    await expect(listRows(path)).rejects.toMatchObject({ status: 502 });
  });
  it("keeps a catalog HTTP failure as an error instead of replacing it with an empty list", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: false,
          status: 503,
          json: async () => ({ message: "Catalog unavailable" }),
        }),
    );
    await expect(listRows("tables")).rejects.toEqual(
      new ApiError(503, "Catalog unavailable"),
    );
  });
});
