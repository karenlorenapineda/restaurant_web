import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";
import { setLocale } from "./i18n";

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  setLocale("es");
  vi.stubGlobal("scrollTo", vi.fn());
});

afterEach(() => {
  setLocale("es");
  window.history.replaceState({}, "", "/");
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("switches Spanish and English across the home and order pages", () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Buena comida, grandes momentos" }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("es");

    fireEvent.click(screen.getAllByRole("button", { name: "English" })[0]!);
    expect(
      screen.getByRole("heading", { name: "Good food, great moments" }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
    expect(window.localStorage.getItem("picasso-locale")).toBe("en");

    fireEvent.click(screen.getByRole("link", { name: "MENU" }));
    expect(window.location.pathname).toBe("/menu");
    expect(
      screen.getByRole("heading", { name: "Family menu" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Creole starter" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "ORDER ONLINE" }));
    expect(window.location.pathname).toBe("/pedido");
    expect(
      screen.getByRole("heading", { name: "Order online" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: "Search dishes" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Español" })[0]!);
    expect(
      screen.getByRole("heading", { name: "Pedido online" }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("es");
    expect(window.localStorage.getItem("picasso-locale")).toBe("es");
  });

  it("opens the English order page directly at /order", () => {
    window.history.replaceState({}, "", "/order");
    setLocale("en");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Order online" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue to details" }),
    ).toBeDisabled();
  });

  it.each(["/pedido/datos", "/order/payment"])(
    "keeps checkout subroute %s in the order flow",
    (path) => {
      window.history.replaceState({}, "", path);
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));

      render(<App />);

      expect(
        screen.getByRole("heading", { name: "Pedido online" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("searchbox", { name: "Buscar platos" }),
      ).toBeInTheDocument();
      expect(window.location.pathname).toBe(
        path.startsWith("/order") ? "/order" : "/pedido",
      );
    },
  );

  it("returns to dish selection from the header without losing the cart", () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));
    render(<App />);

    fireEvent.click(screen.getByRole("link", { name: "PEDIR ONLINE" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Añadir Entrada criolla" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continuar con datos" }),
    );
    expect(window.location.pathname).toBe("/pedido/datos");

    fireEvent.click(screen.getByRole("link", { name: "PEDIR ONLINE" }));
    expect(window.location.pathname).toBe("/pedido");
    expect(
      screen.getByRole("searchbox", { name: "Buscar platos" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Cantidad")).toHaveTextContent("1");
  });

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
      await screen.findByText(
        "La aplicación y la base de datos están disponibles",
      ),
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
