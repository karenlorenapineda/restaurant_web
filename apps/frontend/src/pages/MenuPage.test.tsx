import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MenuPage } from "./MenuPage";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MenuPage", () => {
  it("renders valid API dishes, hides unavailable dishes and filters categories", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            items: [
              {
                available: true,
                description: "Available starter",
                id: 901,
                name: "API starter",
                price: "$10",
              },
              {
                available: false,
                description: "Unavailable starter",
                id: 902,
                name: "Unavailable API dish",
                price: "$11",
              },
            ],
            title: "Starters",
          },
          {
            items: [
              {
                available: true,
                description: "Available main",
                id: 903,
                name: "API main",
                price: "$20",
              },
            ],
            title: "Mains",
          },
        ],
      }),
    );

    render(<MenuPage navigate={vi.fn()} />);

    expect(
      await screen.findByRole("img", { name: "API starter" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Unavailable API dish" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mains" }));

    expect(
      screen.queryByRole("img", { name: "API starter" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "API main" })).toBeInTheDocument();
  });

  it("shows the example menu when the API request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network unavailable")),
    );

    render(<MenuPage navigate={vi.fn()} />);

    expect(
      await screen.findByText(
        "Mostrando menu de ejemplo mientras se conecta la base de datos.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Empanadas vallunas" }),
    ).toBeInTheDocument();
  });

  it("shows the example menu when the API payload is invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ unexpected: "payload" }),
      }),
    );

    render(<MenuPage navigate={vi.fn()} />);

    expect(
      await screen.findByText(
        "Mostrando menu de ejemplo mientras se conecta la base de datos.",
      ),
    ).toBeInTheDocument();
  });
});
