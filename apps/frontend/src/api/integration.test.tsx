import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrderPage } from "../pages/OrderPage";
import { MenuPage } from "../pages/MenuPage";
import { BackendEmployeePanel } from "../pages/BackendEmployeePanel";
import { setLocale } from "../i18n";
import { fetchMenu } from "./menu";
import { parseCop, request } from "./client";

const dish = {
  id: 10,
  name: "Pizza API",
  description: null,
  price: "$25.000,50 COP",
  available: true,
};
const response = (value: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => value,
});
beforeEach(() => {
  vi.stubEnv("VITE_DATA_MODE", "api");
  setLocale("es");
  window.history.replaceState({}, "", "/pedido");
  window.localStorage.clear();
  vi.stubGlobal("scrollTo", vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("backend integration", () => {
  it("normalizes nullable descriptions and retains real IDs and decimal prices", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response([{ title: "Pizzas", items: [dish] }])),
    );
    const menu = await fetchMenu();
    expect(menu[0]?.items[0]).toMatchObject({
      id: 10,
      description: "",
      price: "$25.000,50 COP",
    });
    expect(parseCop(dish.price)).toBe(25000.5);
  });
  it("does not show demo dishes when the API is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));
    render(<MenuPage navigate={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo cargar la carta",
    );
    expect(screen.queryByText("Entrada criolla")).not.toBeInTheDocument();
  });
  it("submits once with real IDs, uses the server total and does not persist an order locally", async () => {
    let resolveSave!: (value: unknown) => void;
    const fetch = vi.fn().mockImplementation((url: string) =>
      url === "/api/menu"
        ? Promise.resolve(response([{ title: "Pizzas", items: [dish] }]))
        : new Promise((resolve) => {
            resolveSave = resolve;
          }),
    );
    vi.stubGlobal("fetch", fetch);
    render(<OrderPage navigate={vi.fn()} />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Añadir Pizza API" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continuar con datos" }),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Nombre" }), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Teléfono" }), {
      target: { value: "600123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Revisar pedido" }));
    expect(
      screen.queryByRole("textbox", { name: "Número de tarjeta" }),
    ).not.toBeInTheDocument();
    const submit = screen.getByRole("button", { name: "Enviar pedido" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(submit).toBeDisabled();
    const writes = fetch.mock.calls.filter(([url]) => url === "/api/orders");
    expect(writes).toHaveLength(1);
    expect(JSON.parse(writes[0]![1].body)).toEqual({
      type: "takeaway",
      customerName: "Ana",
      customerPhone: "600123456",
      items: [{ itemId: 10, quantity: 1 }],
    });
    await act(async () =>
      resolveSave(
        response(
          {
            id: 81,
            total: "19999.50",
            orderDate: "2026-10-24T12:00:00Z",
            status: "queued",
          },
          201,
        ),
      ),
    );
    expect(
      await screen.findByText("Pedido enviado al restaurante"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Total:\s*\$19\.999,5 COP/)).toBeInTheDocument();
    expect(window.localStorage.getItem("picasso-online-orders")).toBeNull();
  });
  it("propagates validation messages and the HTTP status", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          response(
            { message: ["name is required", "unitId must be positive"] },
            400,
          ),
        ),
    );
    await expect(
      request("supplies", { method: "POST", body: {} }),
    ).rejects.toMatchObject({
      status: 400,
      message: "name is required · unitId must be positive",
    });
  });

  function panelFetch(status = 200) {
    const orders = [
      {
        id: 50,
        customer: "Ana",
        status: "queued",
        total: "$25.000 COP",
        tableOrLocation: "Para llevar",
        items: [],
      },
    ];
    return vi
      .fn()
      .mockImplementation(async (url: string, options?: RequestInit) => {
        if (options?.method === "PATCH")
          return response(
            { message: "The order status has already changed" },
            status,
          );
        const values: Record<string, unknown> = {
          "/api/employees/positions": [{ id: 8, name: "Cocina" }],
          "/api/tables": [{ id: 42, tableNumber: "Terraza 7", capacity: 4 }],
          "/api/categories": [{ id: 2, name: "Pizzas" }],
          "/api/units": [
            {
              id: 7,
              name: "Gramos",
              abbreviation: "g",
              type: "weight",
              baseFactor: "1",
            },
          ],
          "/api/supplies": [
            {
              id: 5,
              name: "Harina",
              const: "$1.500 COP",
              stock: "20",
              threshold: "2",
              unit: "g",
            },
          ],
          "/api/menu/management": [
            {
              ...dish,
              description: "",
              category: "Pizzas",
              active: true,
              featured: false,
              showImage: false,
              recipe: null,
            },
          ],
          "/api/employees": [
            {
              id: 31,
              userId: 91,
              firstName: "Sara",
              lastName: "API",
              name: "Sara API",
              phone: "600123456",
              email: "sara@example.test",
              positionId: 8,
              position: "Cocina",
              restaurantId: 1,
              role: "Chef",
              active: true,
            },
          ],
          "/api/restaurant": [{ id: 1, name: "Picasso" }],
          "/api/orders": orders,
          "/api/recipes": {},
        };
        return response(values[url] ?? []);
      });
  }
  it("maps stock display fields to numeric PATCH fields and keeps the unit ID", async () => {
    const fetch = panelFetch();
    vi.stubGlobal("fetch", fetch);
    render(<BackendEmployeePanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Vista de administrador/ }),
    );
    await screen.findByText("Pizza API");
    fireEvent.click(screen.getByRole("button", { name: "Insumos" }));
    await screen.findByDisplayValue("Harina");
    fireEvent.change(screen.getByRole("spinbutton", { name: "Stock" }), {
      target: { value: "12.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() =>
      expect(
        fetch.mock.calls.some(
          ([url, options]) =>
            url === "/api/supplies/5" && options.method === "PATCH",
        ),
      ).toBe(true),
    );
    const call = fetch.mock.calls.find(
      ([url, options]) =>
        url === "/api/supplies/5" && options.method === "PATCH",
    )!;
    expect(JSON.parse(call[1].body)).toEqual({
      name: "Harina",
      unitId: 7,
      unitCost: 1500,
      currentStock: 12.5,
      minimumStock: 2,
    });
  });
  it("offers only legal transitions and preserves the displayed order on a 409", async () => {
    vi.stubGlobal("fetch", panelFetch(409));
    render(<BackendEmployeePanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Vista de administrador/ }),
    );
    await screen.findByText("Pizza API");
    fireEvent.click(screen.getByRole("button", { name: "Pedidos" }));
    await screen.findByText("Ana");

    expect(
      screen.queryByRole("button", { name: "Entregado" }),
    ).not.toBeInTheDocument();
    const state = screen.getByRole("combobox", { name: "Estado" });
    expect(
      within(state)
        .getAllByRole("option")
        .map((option) => option.getAttribute("value")),
    ).toEqual(["queued", "preparing", "cancelled"]);
    fireEvent.change(state, { target: { value: "preparing" } });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "already changed",
    );
    expect(screen.getByRole("combobox", { name: "Estado" })).toHaveValue(
      "queued",
    );
  });
  it("restores each role view and keeps stock read-only in the service view", async () => {
    const fetch = panelFetch();
    vi.stubGlobal("fetch", fetch);
    render(<BackendEmployeePanel />);
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Vista de sala/ }));
    const stock = await screen.findByDisplayValue("Harina");
    expect(stock).toHaveAttribute("readonly");
    expect(
      screen.queryByRole("button", { name: "Empleados" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Guardar cambios" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Salir" }));
    fireEvent.click(screen.getByRole("button", { name: /Vista de cocina/ }));
    expect(await screen.findByDisplayValue("Pizza API")).toHaveAttribute(
      "readonly",
    );
    fireEvent.click(screen.getByRole("button", { name: "Pedidos" }));
    expect(
      screen.queryByRole("button", { name: "Anadir pedido" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Estado" })).not.toBeDisabled();
  });
  it("edits employee fields with the real record ID and does not invent role writes", async () => {
    const fetch = panelFetch();
    vi.stubGlobal("fetch", fetch);
    render(<BackendEmployeePanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Vista de administrador/ }),
    );
    await screen.findByText("Pizza API");
    fireEvent.click(screen.getByRole("button", { name: "Empleados" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Nombre" }), {
      target: { value: "Ana" },
    });
    expect(screen.getByRole("textbox", { name: "Rol" })).toHaveAttribute(
      "readonly",
    );
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "readonly",
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() =>
      expect(
        fetch.mock.calls.some(
          ([url, options]) =>
            url === "/api/employees/31" && options?.method === "PATCH",
        ),
      ).toBe(true),
    );
    const call = fetch.mock.calls.find(
      ([url, options]) =>
        url === "/api/employees/31" && options?.method === "PATCH",
    )!;
    expect(JSON.parse(call[1].body)).toEqual({
      firstName: "Ana",
      lastName: "API",
      phone: "600123456",
      positionId: 8,
    });
  });
  it("keeps an unsent order after an API failure and never edits saved quantities", async () => {
    const fetch = panelFetch();
    const base = fetch.getMockImplementation()!;
    fetch.mockImplementation(async (url: string, options?: RequestInit) =>
      options?.method === "POST"
        ? response({ message: "Stock conflict" }, 409)
        : base(url, options),
    );
    vi.stubGlobal("fetch", fetch);
    render(<BackendEmployeePanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Vista de administrador/ }),
    );
    await screen.findByText("Pizza API");
    fireEvent.click(screen.getByRole("button", { name: "Pedidos" }));
    expect(
      screen.queryByRole("spinbutton", { name: /Cantidad/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Anadir pedido" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Cliente" }), {
      target: { value: "Mesa API" },
    });
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Cantidad Pizza API" }),
      { target: { value: "2" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Stock conflict",
    );
    expect(screen.getByRole("textbox", { name: "Cliente" })).toHaveValue(
      "Mesa API",
    );
    expect(
      screen.getByRole("spinbutton", { name: "Cantidad Pizza API" }),
    ).toHaveValue(2);
    const call = fetch.mock.calls.find(
      ([url, options]) => url === "/api/orders" && options?.method === "POST",
    )!;
    expect(JSON.parse(call[1].body)).toEqual({
      type: "takeaway",
      customerName: "Mesa API",
      items: [{ itemId: 10, quantity: 2 }],
    });
  });
  it("uses category and recipe IDs when saving the original dish form", async () => {
    const fetch = panelFetch();
    const base = fetch.getMockImplementation()!;
    fetch.mockImplementation(async (url: string, options?: RequestInit) => {
      if (url === "/api/recipes" && options?.method === "GET")
        return response({
          "10": {
            itemId: 10,
            name: "Pizza API",
            recipe: null,
            ingredients: [
              {
                id: 71,
                ingredientId: 5,
                unitId: 7,
                quantity: "2",
                supplyName: "Harina",
                unit: "g",
              },
            ],
          },
        });
      return base(url, options);
    });
    vi.stubGlobal("fetch", fetch);
    render(<BackendEmployeePanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Vista de administrador/ }),
    );
    await screen.findByText("Pizza API");
    fireEvent.change(screen.getByRole("textbox", { name: "Nombre" }), {
      target: { value: "Pizza guardada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() =>
      expect(
        fetch.mock.calls.some(
          ([url, options]) =>
            url === "/api/menu/10" && options?.method === "PATCH",
        ),
      ).toBe(true),
    );
    const call = fetch.mock.calls.find(
      ([url, options]) => url === "/api/menu/10" && options?.method === "PATCH",
    )!;
    expect(JSON.parse(call[1].body)).toMatchObject({
      name: "Pizza guardada",
      price: 25000.5,
      categoryId: 2,
      ingredients: [{ id: 71, ingredientId: 5, unitId: 7, quantity: 2 }],
    });
  });
  it("searches and paginates API dishes while preserving filters across languages", async () => {
    const items = Array.from({ length: 8 }, (_, index) => ({
      ...dish,
      id: 101 + index,
      name: `Plato API ${index + 1}`,
      description: "Limón fresco",
      price: `$${index + 1}.000,50 COP`,
    }));
    const fetch = vi
      .fn()
      .mockResolvedValue(response([{ title: "Pizzas", items }]));
    vi.stubGlobal("fetch", fetch);
    render(<MenuPage navigate={vi.fn()} />);
    await screen.findByRole("img", { name: "Plato API 1" });
    expect(screen.getAllByRole("img")).toHaveLength(6);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(
      screen.getByRole("img", { name: "Plato API 8" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Buscar platos"), {
      target: { value: "limon" },
    });
    expect(screen.getByText("Página 1 / 2")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Precio mínimo (COP)"), {
      target: { value: "3000.5" },
    });
    fireEvent.change(screen.getByLabelText("Precio máximo (COP)"), {
      target: { value: "6000.5" },
    });
    fireEvent.change(screen.getByLabelText("Ordenar por"), {
      target: { value: "price-desc" },
    });
    expect(
      screen.getAllByRole("img").map((image) => image.getAttribute("alt")),
    ).toEqual(["Plato API 6", "Plato API 5", "Plato API 4", "Plato API 3"]);
    act(() => setLocale("en"));
    expect(screen.getByLabelText("Search dishes")).toHaveValue("limon");
    expect(screen.getByLabelText("Minimum price (COP)")).toHaveValue(3000.5);
    act(() => setLocale("pt"));
    expect(screen.getByLabelText("Pesquisar pratos")).toHaveValue("limon");
    expect(screen.getAllByRole("img")).toHaveLength(4);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("combines connected panel search and availability without losing an edited draft", async () => {
    const fetch = panelFetch();
    const base = fetch.getMockImplementation()!;
    fetch.mockImplementation(async (url: string, options?: RequestInit) => {
      if (url === "/api/menu/management" && options?.method === "GET") {
        return response(
          Array.from({ length: 8 }, (_, index) => ({
            ...dish,
            id: 101 + index,
            name: `Plato API ${index + 1}`,
            description: "Limón fresco",
            category: "Pizzas",
            categoryId: 2,
            active: index !== 7,
            featured: false,
            showImage: false,
            recipe: null,
          })),
        );
      }
      return base(url, options);
    });
    vi.stubGlobal("fetch", fetch);
    render(<BackendEmployeePanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Vista de administrador/ }),
    );
    await screen.findByText("Plato API 1");
    fireEvent.change(screen.getByRole("textbox", { name: "Nombre" }), {
      target: { value: "My draft" },
    });
    fireEvent.change(screen.getByLabelText("Buscar platos"), {
      target: { value: "limon" },
    });
    fireEvent.change(screen.getByLabelText("Disponibilidad"), {
      target: { value: "unavailable" },
    });
    expect(screen.getByText("Plato API 8")).toBeInTheDocument();
    expect(screen.queryByText("Plato API 1")).not.toBeInTheDocument();
    act(() => setLocale("en"));
    expect(screen.getByLabelText("Availability")).toHaveValue("unavailable");
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(
      "My draft",
    );
    act(() => setLocale("pt"));
    expect(screen.getByLabelText("Pesquisar pratos")).toHaveValue("limon");
    expect(screen.getByRole("textbox", { name: "Nome" })).toHaveValue(
      "My draft",
    );
    expect(
      fetch.mock.calls.every(([, options]) => options?.method === "GET"),
    ).toBe(true);
  });
  it("selects a position by name and submits its ID without changing account data", async () => {
    const fetch = panelFetch();
    const base = fetch.getMockImplementation()!;
    fetch.mockImplementation(async (url: string, options?: RequestInit) =>
      url === "/api/employees/positions"
        ? response([
            { id: 8, name: "Cocina" },
            { id: 91, name: "Sala" },
          ])
        : base(url, options),
    );
    vi.stubGlobal("fetch", fetch);
    render(<BackendEmployeePanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Vista de administrador/ }),
    );
    await screen.findByText("Pizza API");
    fireEvent.click(screen.getByRole("button", { name: "Empleados" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Puesto" }), {
      target: { value: "91" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() =>
      expect(
        fetch.mock.calls.some(
          ([url, options]) =>
            url === "/api/employees/31" && options?.method === "PATCH",
        ),
      ).toBe(true),
    );
    const call = fetch.mock.calls.find(
      ([url, options]) =>
        url === "/api/employees/31" && options?.method === "PATCH",
    )!;
    expect(JSON.parse(call[1].body)).toEqual({
      firstName: "Sara",
      lastName: "API",
      phone: "600123456",
      positionId: 91,
    });
  });
  it("shows table labels and submits the actual table ID for dine-in orders", async () => {
    const fetch = panelFetch();
    const base = fetch.getMockImplementation()!;
    fetch.mockImplementation(async (url: string, options?: RequestInit) =>
      options?.method === "POST"
        ? response(
            {
              id: 77,
              total: "25000.50",
              status: "queued",
              orderDate: "2026-11-01T12:00:00Z",
            },
            201,
          )
        : base(url, options),
    );
    vi.stubGlobal("fetch", fetch);
    render(<BackendEmployeePanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Vista de administrador/ }),
    );
    await screen.findByText("Pizza API");
    fireEvent.click(screen.getByRole("button", { name: "Pedidos" }));
    fireEvent.click(screen.getByRole("button", { name: "Anadir pedido" }));
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Cantidad Pizza API" }),
      { target: { value: "1" } },
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Tipo" }), {
      target: { value: "dine_in" },
    });
    expect(
      screen.getByRole("option", { name: "Terraza 7 · 4 plazas" }),
    ).toHaveValue("42");
    fireEvent.change(screen.getByRole("combobox", { name: "Mesa" }), {
      target: { value: "42" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));
    await waitFor(() =>
      expect(
        fetch.mock.calls.some(
          ([url, options]) =>
            url === "/api/orders" && options?.method === "POST",
        ),
      ).toBe(true),
    );
    const call = fetch.mock.calls.find(
      ([url, options]) => url === "/api/orders" && options?.method === "POST",
    )!;
    expect(JSON.parse(call[1].body)).toMatchObject({
      type: "dine_in",
      tableId: 42,
    });
  });
  it("prevents a dine-in order when the table catalog is empty", async () => {
    const fetch = panelFetch();
    const base = fetch.getMockImplementation()!;
    fetch.mockImplementation(async (url: string, options?: RequestInit) =>
      url === "/api/tables" ? response([]) : base(url, options),
    );
    vi.stubGlobal("fetch", fetch);
    render(<BackendEmployeePanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Vista de administrador/ }),
    );
    await screen.findByText("Pizza API");
    fireEvent.click(screen.getByRole("button", { name: "Pedidos" }));
    fireEvent.click(screen.getByRole("button", { name: "Anadir pedido" }));
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Cantidad Pizza API" }),
      { target: { value: "1" } },
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Tipo" }), {
      target: { value: "dine_in" },
    });
    expect(screen.getByRole("combobox", { name: "Mesa" })).toBeDisabled();
    expect(screen.getByText("No hay mesas disponibles.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));
    await screen.findByRole("alert");
    expect(
      fetch.mock.calls.some(([, options]) => options?.method === "POST"),
    ).toBe(false);
  });
});
