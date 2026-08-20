import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("shows that the application and database are online", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "ok",
          services: { database: "up" },
          timestamp: new Date().toISOString(),
        }),
      }),
    );

    render(<App />);

    expect(
      await screen.findByText("Application and database are online"),
    ).toBeInTheDocument();
  });

  it("shows an unavailable status when the health request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network unavailable")),
    );

    render(<App />);

    expect(
      await screen.findByText("Servicios no disponibles"),
    ).toBeInTheDocument();
  });

  it("shows an unavailable status when the database is down", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "ok",
          services: { database: "down" },
          timestamp: new Date().toISOString(),
        }),
      }),
    );

    render(<App />);

    expect(
      await screen.findByText("Servicios no disponibles"),
    ).toBeInTheDocument();
  });
});
