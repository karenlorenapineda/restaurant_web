import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setLocale, t, useLocale } from "../../i18n";
import type { SupplyRecord } from "../../mocks/employeePanel";
import { SuppliesManagement } from "./SuppliesManagement";

afterEach(() => setLocale("es"));

describe.each(["Insumo", "Articulo"])("%s name editing", (itemNameLabel) => {
  it.each([
    ["en", "Arroz integral"],
    ["pt", "Ensalada fresca"],
  ] as const)(
    "preserves typed names and language changes in %s",
    (locale, name) => {
      setLocale(locale);
      const onUpdate = vi.fn();
      function Editor() {
        useLocale();
        const [items, setItems] = useState<SupplyRecord[]>([
          {
            id: 1,
            name: "",
            unit: "kg",
            cost: "1",
            stock: "10",
            threshold: "1",
          },
        ]);
        return (
          <SuppliesManagement
            addLabel="Add"
            canEdit
            description=""
            emptyReadOnlyMessage=""
            itemNameLabel={itemNameLabel}
            items={items}
            onAdd={vi.fn()}
            onDelete={vi.fn()}
            onUpdate={(id, field, value) => {
              onUpdate(id, field, value);
              setItems((current) =>
                current.map((item) =>
                  item.id === id ? { ...item, [field]: value } : item,
                ),
              );
            }}
            title="Stock"
          />
        );
      }
      render(<Editor />);
      const input = screen.getByRole("textbox", {
        name: t(itemNameLabel),
      }) as HTMLInputElement;
      for (const character of name) {
        fireEvent.change(input, { target: { value: input.value + character } });
      }
      expect(onUpdate).toHaveBeenLastCalledWith(1, "name", name);
      expect(input).toHaveValue(name);

      act(() => setLocale("es"));
      expect(input).toHaveValue(name);
      act(() => setLocale(locale === "en" ? "pt" : "en"));
      expect(input).toHaveValue(name);
    },
  );
});
