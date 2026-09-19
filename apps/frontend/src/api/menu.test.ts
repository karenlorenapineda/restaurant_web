import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchMenu } from "./menu";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchMenu", () => {
  it("returns valid menu sections and sends the expected request", async () => {
    const menu = [
      {
        items: [
          {
            description: "API description",
            name: "API dish",
            price: "$10",
          },
        ],
        title: "API category",
      },
    ];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => menu,
    });
    const signal = new AbortController().signal;
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchMenu(signal)).resolves.toEqual(menu);
    expect(fetchMock).toHaveBeenCalledWith("/api/menu", {
      headers: { Accept: "application/json" },
      signal,
    });
  });

  it("rejects unsuccessful HTTP responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    await expect(fetchMenu()).rejects.toThrow("Menu request failed");
  });

  it.each([
    { title: "not an array", payload: {} },
    {
      title: "a dish without required fields",
      payload: [{ items: [{ name: "Incomplete dish" }], title: "Category" }],
    },
  ])("rejects $title", async ({ payload }) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      }),
    );

    await expect(fetchMenu()).rejects.toThrow("Invalid menu response");
  });
});
