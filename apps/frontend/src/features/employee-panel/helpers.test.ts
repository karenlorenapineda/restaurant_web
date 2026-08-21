import { describe, expect, it } from "vitest";

import type { EditableDish } from "../../menuStore";
import type { OrderRecord, SupplyRecord } from "../../mocks/employeePanel";
import {
  convertRecipeQuantityToSupplyUnit,
  getOrderItemsLabel,
  getOrderLines,
  normalizeOrderStatus,
  updateSuppliesForDishQuantityChange,
  updateSuppliesForOrderConfirmation,
  updateSuppliesForOrderRemoval,
} from "./helpers";

const testDish: EditableDish = {
  available: true,
  categoryTitle: "Mains",
  description: "",
  id: 10,
  name: "Test dish",
  price: "$20",
  recipeSupplies: [{ quantity: "500", supplyName: "Rice", unit: "g" }],
};

const dishes: EditableDish[] = [testDish];

const supplies: SupplyRecord[] = [
  {
    cost: "$2",
    id: 1,
    name: "Rice",
    stock: "2",
    threshold: "1",
    unit: "kg",
  },
];

describe("employee panel helpers", () => {
  it("normalizes legacy order statuses", () => {
    expect(normalizeOrderStatus("recibido")).toBe("cola");
    expect(normalizeOrderStatus("en cocina")).toBe("preparando");
    expect(normalizeOrderStatus("entregado")).toBe("terminado");
  });

  it("builds order lines from repeated dish keys", () => {
    const order = {
      customer: "Table",
      dishKeys: ["10", "10"],
      id: 1,
      items: "Test dish",
      notes: "",
      status: "cola",
      table: "1",
      total: "$40",
    } satisfies OrderRecord;

    expect(getOrderLines(order, dishes)).toEqual([
      { dishKey: "10", quantity: 2 },
    ]);
    expect(getOrderItemsLabel(getOrderLines(order, dishes), dishes)).toBe(
      "2x Test dish",
    );
  });

  it("updates supply stock when confirming and removing orders", () => {
    const order = {
      customer: "Table",
      id: 1,
      items: "Test dish",
      notes: "",
      orderLines: [{ dishKey: "10", quantity: 2 }],
      status: "cola",
      table: "1",
      total: "$40",
    } satisfies OrderRecord;

    const afterConfirmation = updateSuppliesForOrderConfirmation(
      supplies,
      order,
      dishes,
    );
    expect(afterConfirmation.at(0)?.stock).toBe("1");

    const afterRemoval = updateSuppliesForOrderRemoval(
      afterConfirmation,
      order,
      dishes,
    );
    expect(afterRemoval.at(0)?.stock).toBe("2");
  });

  it("converts recipe quantities to the inventory unit", () => {
    expect(
      convertRecipeQuantityToSupplyUnit(
        { quantity: "500", supplyName: "Rice", unit: "g" },
        "kg",
      ),
    ).toBe(0.5);
    expect(
      convertRecipeQuantityToSupplyUnit(
        { quantity: "1,5", supplyName: "Water", unit: "l" },
        "ml",
      ),
    ).toBe(1500);
    expect(
      convertRecipeQuantityToSupplyUnit(
        { quantity: "250", supplyName: "Water", unit: "ml" },
        "l",
      ),
    ).toBe(0.25);
  });

  it("does not discount ingredients removed from an order", () => {
    const dish: EditableDish = {
      ...testDish,
      recipeSupplies: [
        { quantity: "500", supplyName: "Rice", unit: "g" },
        { quantity: "100", supplyName: "Salt", unit: "g" },
      ],
    };
    const suppliesWithSalt = [
      ...supplies,
      {
        cost: "$1",
        id: 2,
        name: "Salt",
        stock: "1",
        threshold: "0.2",
        unit: "kg",
      },
    ];

    const nextSupplies = updateSuppliesForDishQuantityChange(
      suppliesWithSalt,
      dish,
      2,
      ["Salt"],
    );

    expect(nextSupplies.find((supply) => supply.name === "Rice")?.stock).toBe(
      "1",
    );
    expect(nextSupplies.find((supply) => supply.name === "Salt")?.stock).toBe(
      "1",
    );
    expect(suppliesWithSalt[0]?.stock).toBe("2");
  });

  it("keeps the same stock when the dish quantity does not change", () => {
    expect(updateSuppliesForDishQuantityChange(supplies, testDish, 0)).toBe(
      supplies,
    );
  });
});
