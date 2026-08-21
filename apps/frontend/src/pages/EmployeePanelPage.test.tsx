import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { menuSections } from "../data/menu";
import {
  saveFeaturedDishKeys,
  saveGalleryDishKeys,
  saveStoredMenu,
} from "../menuStore";
import { EmployeePanelPage } from "./EmployeePanelPage";
import { MenuPage } from "./MenuPage";

function renderEmployeePanel() {
  return render(<EmployeePanelPage navigate={vi.fn()} />);
}

function startRolePreview(roleName: string) {
  fireEvent.click(
    screen.getByRole("button", {
      name: new RegExp(roleName, "i"),
    }),
  );
}

beforeEach(() => {
  saveStoredMenu(menuSections);
  saveFeaturedDishKeys([]);
  saveGalleryDishKeys([]);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("EmployeePanelPage", () => {
  it("uses a role preview instead of a password login", async () => {
    renderEmployeePanel();

    expect(screen.getByText("Employee dashboard preview")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Admin2026")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();

    startRolePreview("Admin preview");

    expect(
      await screen.findByText("Gestion interna del asadero"),
    ).toBeInTheDocument();
    expect(screen.getByText("Rol: admin")).toBeInTheDocument();
  });

  it("shows every management area to the admin preview", () => {
    renderEmployeePanel();
    startRolePreview("Admin preview");

    ["Menu", "Empleados", "Insumos", "Inventario", "Pedidos", "Chat"].forEach(
      (tabName) => {
        expect(
          screen.getByRole("button", { name: tabName }),
        ).toBeInTheDocument();
      },
    );

    fireEvent.click(screen.getByRole("button", { name: "Empleados" }));

    expect(
      screen.getByRole("heading", { name: "Gestion de empleados" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Anadir empleado" }),
    ).toBeInTheDocument();
  });

  it("limits the service preview to its allowed management areas", () => {
    renderEmployeePanel();
    startRolePreview("Service preview");

    expect(
      screen.queryByRole("button", { name: "Menu" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Empleados" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Gestion de insumos" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pedidos" }));

    expect(
      screen.getByRole("button", { name: "Anadir pedido" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Receta cocina")).not.toBeInTheDocument();
  });

  it("lets the kitchen preview read recipes and update order status only", () => {
    renderEmployeePanel();
    startRolePreview("Kitchen preview");

    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Empleados" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Anadir plato" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Guardar cambios" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pedidos" }));

    expect(
      screen.queryByRole("button", { name: "Anadir pedido" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Cocina puede ver pedidos y cambiarlos de estado/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Receta cocina")).toBeInTheDocument();
  });

  it("discounts stock on order confirmation and restores it on deletion", () => {
    renderEmployeePanel();
    startRolePreview("Admin preview");
    fireEvent.click(screen.getByRole("button", { name: "Pedidos" }));
    fireEvent.click(screen.getByRole("button", { name: "Anadir pedido" }));

    expect(screen.getByText(/Pedido sin confirmar/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));
    fireEvent.click(screen.getByRole("button", { name: "Insumos" }));

    expect(screen.getByDisplayValue("27,955")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pedidos" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar pedido Mesa" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Insumos" }));

    expect(screen.getByDisplayValue("28")).toBeInTheDocument();
  });

  it("creates, publishes and deletes a preview dish", () => {
    const employeePanel = renderEmployeePanel();
    startRolePreview("Admin preview");
    fireEvent.click(screen.getByRole("button", { name: "Anadir plato" }));

    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Integration test dish" },
    });
    fireEvent.change(screen.getByLabelText("Categoria"), {
      target: { value: "Bebidas y postres" },
    });
    fireEvent.change(screen.getByLabelText("Precio"), {
      target: { value: "$12" },
    });
    fireEvent.change(screen.getByLabelText("Descripcion"), {
      target: { value: "Dish created from the employee panel test." },
    });
    fireEvent.click(
      screen.getByLabelText("Mostrar como favorito en la pagina principal"),
    );
    fireEvent.click(
      screen.getByLabelText("Mostrar imagen del plato en la galeria"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(
      screen.getByText("Preview menu updated for this session."),
    ).toBeInTheDocument();
    expect(screen.getByText("Integration test dish")).toBeInTheDocument();

    employeePanel.unmount();
    const publicMenu = render(<MenuPage navigate={vi.fn()} />);

    expect(
      screen.getByRole("img", { name: "Integration test dish" }),
    ).toBeInTheDocument();

    publicMenu.unmount();
    renderEmployeePanel();
    startRolePreview("Admin preview");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Eliminar Integration test dish",
      }),
    );

    expect(
      screen.queryByRole("button", { name: /Integration test dish/i }),
    ).not.toBeInTheDocument();
  });
});
