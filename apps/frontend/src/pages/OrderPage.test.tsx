import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { menuSections } from "../data/menu";
import { setLocale } from "../i18n";
import { saveStoredMenu } from "../menuStore";
import { getOnlineOrders } from "../onlineOrderStore";
import { EmployeePanelPage } from "./EmployeePanelPage";
import { OrderPage } from "./OrderPage";

beforeEach(() => {
  window.history.replaceState({}, "", "/pedido");
  window.localStorage.clear();
  saveStoredMenu(menuSections);
  setLocale("es");
  vi.stubGlobal("scrollTo", vi.fn());
});

afterEach(() => {
  window.history.replaceState({}, "", "/");
  setLocale("es");
  vi.unstubAllGlobals();
});

describe("OrderPage", () => {
  it.each([
    ["/pedido/datos", "/pedido"],
    ["/pedido/pago", "/pedido"],
    ["/order/details", "/order"],
    ["/order/payment", "/order"],
  ])("returns %s to %s when the cart is empty", (path, basePath) => {
    window.history.replaceState({}, "", path);
    render(<OrderPage navigate={vi.fn()} />);

    expect(window.location.pathname).toBe(basePath);
    expect(
      screen.getByRole("searchbox", { name: "Buscar platos" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Pago" }),
    ).not.toBeInTheDocument();
  });

  it("requires dish selection and customer details before payment", () => {
    render(<OrderPage navigate={vi.fn()} />);

    const steps = within(
      screen.getByRole("navigation", { name: "Pasos del pedido" }),
    ).getAllByRole("button");
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveAttribute("aria-current", "step");
    expect(steps[1]).toBeDisabled();
    expect(steps[2]).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Añadir Entrada criolla" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continuar con datos" }),
    );
    expect(window.location.pathname).toBe("/pedido/datos");
    expect(steps[1]).toHaveAttribute("aria-current", "step");
    expect(steps[2]).toBeDisabled();

    fireEvent.change(screen.getByRole("textbox", { name: "Nombre" }), {
      target: { value: "Cliente de prueba" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Teléfono" }), {
      target: { value: "3001234567" },
    });
    fireEvent.click(steps[0]!);
    expect(window.location.pathname).toBe("/pedido");
    expect(screen.getByLabelText("Cantidad")).toHaveTextContent("1");
    fireEvent.click(
      screen.getByRole("button", { name: "Continuar con datos" }),
    );
    expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveValue(
      "Cliente de prueba",
    );
    expect(screen.getByRole("textbox", { name: "Teléfono" })).toHaveValue(
      "3001234567",
    );
    expect(getOnlineOrders()).toHaveLength(0);
  });

  it("keeps the payment preview non-transactional until registration", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<OrderPage navigate={vi.fn()} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Añadir Entrada criolla" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continuar con datos" }),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Nombre" }), {
      target: { value: "Cliente de pago" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Teléfono" }), {
      target: { value: "3001234567" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar al pago" }));

    expect(screen.getByRole("heading", { name: "Pago" })).toBeInTheDocument();
    expect(
      screen.getByText(/no se realizará ningún cargo/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Número de tarjeta" }),
    ).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Caducidad" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "CVC" })).toBeDisabled();
    expect(getOnlineOrders()).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "PSE" }));
    expect(
      screen.getByRole("combobox", { name: "Selecciona tu banco" }),
    ).toBeDisabled();
    expect(getOnlineOrders()).toHaveLength(0);
    fireEvent.click(
      screen.getByRole("button", { name: "Registrar pedido de prueba" }),
    );
    expect(getOnlineOrders()).toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("registers a delivery order and keeps its employee status after reopening", () => {
    const customer = render(<OrderPage navigate={vi.fn()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Añadir Entrada criolla" }),
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: "Añadir Entrada criolla" })[0]!,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continuar con datos" }),
    );
    expect(window.location.pathname).toBe("/pedido/datos");
    expect(
      screen.queryByRole("searchbox", { name: "Buscar platos" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar al pago" }));
    expect(window.location.pathname).toBe("/pedido/datos");
    fireEvent.click(screen.getByRole("button", { name: "A domicilio" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Nombre" }), {
      target: { value: "Sara Prueba" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Teléfono" }), {
      target: { value: "3001234567" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: "Dirección de entrega" }),
      {
        target: { value: "Calle 10 #20-30" },
      },
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Notas para cocina" }),
      {
        target: { value: "Sin picante" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Continuar al pago" }));
    expect(window.location.pathname).toBe("/pedido/pago");
    expect(screen.getByRole("heading", { name: "Pago" })).toBeInTheDocument();
    act(() => {
      window.history.replaceState({}, "", "/pedido/datos");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveValue(
      "Sara Prueba",
    );
    fireEvent.click(screen.getByRole("button", { name: "Continuar al pago" }));
    expect(
      screen.getByRole("textbox", { name: "Número de tarjeta" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "PSE" }));
    expect(
      screen.getByRole("combobox", { name: "Selecciona tu banco" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Volver a tus datos" }));
    expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveValue(
      "Sara Prueba",
    );
    expect(
      screen.getByRole("textbox", { name: "Dirección de entrega" }),
    ).toHaveValue("Calle 10 #20-30");
    fireEvent.click(screen.getByRole("button", { name: "Continuar al pago" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Registrar pedido de prueba" }),
    );

    expect(
      screen.getByRole("heading", { name: "Pedido registrado" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/28\.000/)).toBeInTheDocument();
    expect(getOnlineOrders()[0]).toMatchObject({
      customer: "Sara Prueba",
      phone: "3001234567",
      address: "Calle 10 #20-30",
      notes: "Sin picante",
      fulfillment: "delivery",
      status: "cola",
      total: "$28.000 COP",
      cartItems: [{ name: "Entrada criolla", quantity: 2, unitPrice: 14000 }],
    });

    customer.unmount();
    const panel = render(<EmployeePanelPage navigate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Admin preview/i }));
    fireEvent.click(screen.getByRole("button", { name: "Pedidos" }));
    const newOrder = screen.getByRole("button", {
      name: /Domicilio.*Sara Prueba/i,
    });
    expect(within(newOrder).getByText("Pedido online")).toBeInTheDocument();
    expect(screen.getByText(/Calle 10 #20-30/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "preparando" },
    });
    expect(getOnlineOrders()[0]?.status).toBe("preparando");

    panel.unmount();
    render(<EmployeePanelPage navigate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Admin preview/i }));
    fireEvent.click(screen.getByRole("button", { name: "Pedidos" }));
    expect(screen.getByRole("combobox")).toHaveValue("preparando");
  });

  it("filters dishes and registers an English pickup order", () => {
    setLocale("en");
    render(<OrderPage navigate={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Order online" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search dishes" }), {
      target: { value: "Creole" },
    });
    expect(
      screen.getByRole("heading", { name: "Creole starter" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "House special plate" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add Creole starter" }));
    fireEvent.click(
      screen.getAllByRole("button", { name: "Add Creole starter" })[1]!,
    );
    expect(screen.getByLabelText("Quantity")).toHaveTextContent("2");
    fireEvent.click(
      screen.getByRole("button", { name: "Remove Creole starter" }),
    );
    expect(screen.getByLabelText("Quantity")).toHaveTextContent("1");

    fireEvent.click(
      screen.getByRole("button", { name: "Continue to details" }),
    );
    expect(window.location.pathname).toBe("/pedido/datos");
    expect(
      screen.queryByRole("textbox", { name: "Delivery address" }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "English Customer" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Phone" }), {
      target: { value: "3001234567" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to payment" }),
    );
    expect(window.location.pathname).toBe("/pedido/pago");
    expect(
      screen.getByRole("heading", { name: "Payment" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Card number" })).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Register preview order" }),
    );

    expect(
      screen.getByRole("heading", { name: "Order registered" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/14,000/)).toBeInTheDocument();
    expect(getOnlineOrders()[0]).toMatchObject({
      customer: "English Customer",
      fulfillment: "pickup",
      table: "Recogida",
      status: "cola",
      total: "$14.000 COP",
      cartItems: [{ name: "Entrada criolla", quantity: 1, unitPrice: 14000 }],
    });
    expect(getOnlineOrders()[0]?.address).toBeUndefined();
    fireEvent.click(
      screen.getByRole("button", { name: "Place another order" }),
    );
    expect(window.location.pathname).toBe("/pedido");
    expect(
      screen.getByRole("heading", { name: "Order online" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue to details" }),
    ).toBeDisabled();
    expect(getOnlineOrders()).toHaveLength(1);
  });

  it("hides unavailable dishes and disables dishes without a usable price", () => {
    saveStoredMenu([
      {
        title: "Entradas",
        items: [
          {
            id: 901,
            name: "Disponible",
            description: "A la carta",
            price: "$10.000 COP",
            available: true,
          },
          {
            id: 902,
            name: "Agotado",
            description: "Sin existencias",
            price: "$11.000 COP",
            available: false,
          },
          {
            id: 903,
            name: "Sin precio",
            description: "Consultar",
            price: "Consultar",
            available: true,
          },
        ],
      },
    ]);
    render(<OrderPage navigate={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Disponible" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Agotado" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Añadir Sin precio" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Continuar con datos" }),
    ).toBeDisabled();
  });
});
