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
});
