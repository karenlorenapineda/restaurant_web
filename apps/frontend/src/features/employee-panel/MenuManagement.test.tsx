import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { setLocale } from "../../i18n";
import type { EditableDish } from "../../menuStore";
import type { SupplyRecord } from "../../mocks/employeePanel";
import { MenuManagement } from "./MenuManagement";
import { updateSuppliesForDishQuantityChange } from "./helpers";

afterEach(() => setLocale("es"));

it.each([
  ["en", "Salad"],
  ["pt", "Salada"],
] as const)(
  "preserves ingredient names, units and stock deductions in %s",
  (locale, label) => {
    setLocale(locale);
    const initialDish: EditableDish = {
      id: 1,
      name: "Test dish",
      categoryTitle: "Test category",
      description: "",
      price: "$10 COP",
      available: true,
      recipeSupplies: [{ supplyName: "Arroz", quantity: "1", unit: "g" }],
    };
    const supplies: SupplyRecord[] = [
      {
        id: 1,
        name: "Arroz",
        unit: "g",
        cost: "1",
        stock: "10",
        threshold: "1",
      },
      {
        id: 2,
        name: "Ensalada",
        unit: "und",
        cost: "1",
        stock: "10",
        threshold: "1",
      },
    ];
    let editedDish = initialDish;
    function Editor() {
      const [draft, setDraft] = useState(initialDish);
      editedDish = draft;
      return (
        <MenuManagement
          canEdit
          dishes={[initialDish]}
          draft={draft}
          galleryKeys={[]}
          isCreatingDish={false}
          saveMessage=""
          sections={[
            { title: initialDish.categoryTitle, items: [initialDish] },
          ]}
          selectedDishKey="1"
          supplies={supplies}
          deleteDish={vi.fn()}
          saveDish={vi.fn()}
          selectDish={vi.fn()}
          startNewDish={vi.fn()}
          toggleGalleryDish={vi.fn()}
          updateDraft={(field, value) =>
            setDraft((current) => ({ ...current, [field]: value }))
          }
        />
      );
    }
    render(<Editor />);
    const option = screen.getByRole("option", { name: label });
    const select = option.closest("select")!;
    fireEvent.change(select, {
      target: { value: option.getAttribute("value") },
    });

    expect(editedDish.recipeSupplies).toEqual([
      { supplyName: "Ensalada", quantity: "1", unit: "und" },
    ]);
    expect(select).toHaveValue("Ensalada");
    act(() => setLocale("es"));
    expect(select).toHaveValue("Ensalada");
    expect(
      updateSuppliesForDishQuantityChange(supplies, editedDish, 1).map(
        (supply) => supply.stock,
      ),
    ).toEqual(["10", "9"]);
  },
);
