import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setLocale, t } from "./i18n";
import { EmployeePanelPage } from "./pages/EmployeePanelPage";
import { saveStoredMenu } from "./menuStore";
import { menuSections } from "./data/menu";
afterEach(() => {
  setLocale("es");
  saveStoredMenu(menuSections);
});
it("stores the selected locale, updates the document and interpolates user content safely", () => {
  setLocale("en");
  expect(document.documentElement.lang).toBe("en");
  expect(localStorage.getItem("picasso-locale")).toBe("en");
  expect(t("Eliminar {value0}", { value0: "Ana <42>" })).toBe(
    "Delete Ana <42>",
  );
  expect(t("toString")).toBe("toString");
  expect(t("A customer-written description")).toBe(
    "A customer-written description",
  );
});
describe.each([
  [
    "en",
    "Admin preview",
    "Name",
    "Add dish",
    "New dish",
    "Save changes",
    "Preview menu updated for this session.",
  ],
  [
    "pt",
    "Vista de administrador",
    "Nome",
    "Adicionar prato",
    "Novo prato",
    "Guardar alterações",
    "Menu de teste atualizado para esta sessão.",
  ],
] as const)(
  "employee panel in %s",
  (locale, role, name, add, newDish, save, saved) => {
    it("translates actions and save messages and preserves drafts across language changes", () => {
      setLocale(locale);
      render(<EmployeePanelPage navigate={vi.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: new RegExp(role) }));
      fireEvent.click(screen.getByRole("button", { name: add }));
      expect(
        screen.getByRole("heading", { name: newDish }),
      ).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText(name), {
        target: { value: "My custom dish" },
      });
      act(() => setLocale("es"));
      expect(screen.getByLabelText("Nombre")).toHaveValue("My custom dish");
      act(() => setLocale(locale));
      fireEvent.click(screen.getByRole("button", { name: save }));
      expect(screen.getByText(saved)).toBeInTheDocument();
    });
  },
);
