import type { RecipeSupply } from "../../data/menu";
import type { EditableDish } from "../../menuStore";
import { getEditableDishKey } from "../../menuStore";
import { MOCK_RECIPE_BY_DISH } from "../../mocks/employeePanel";
import type {
  OrderLine,
  OrderRecord,
  OrderStatus,
  SupplyRecord,
} from "../../mocks/employeePanel";
export function getDishRecipe(dish: EditableDish) {
  return (
    dish.recipe ??
    MOCK_RECIPE_BY_DISH[dish.name]?.recipe ??
    "Receta interna pendiente por completar."
  );
}

export function getDishRecipeSupplies(dish: EditableDish) {
  if (dish.recipeSupplies) {
    return dish.recipeSupplies;
  }

  if (dish.recipeIngredients) {
    return dish.recipeIngredients.map((ingredient) => ({
      quantity: "1",
      supplyName: ingredient,
      unit: "und",
    }));
  }

  return MOCK_RECIPE_BY_DISH[dish.name]?.ingredients ?? [];
}

export function normalizeOrderStatus(
  status: OrderRecord["status"],
): OrderStatus {
  if (status === "en cocina") {
    return "preparando";
  }

  if (status === "listo" || status === "entregado") {
    return "terminado";
  }

  if (status === "recibido") {
    return "cola";
  }

  return status;
}

export function getOrderDishes(order: OrderRecord, dishes: EditableDish[]) {
  const dishKeys =
    order.orderLines?.map((orderLine) => orderLine.dishKey) ??
    order.dishKeys ??
    [];

  if (dishKeys.length > 0) {
    return dishKeys
      .map((dishKey) =>
        dishes.find((dish) => getEditableDishKey(dish) === dishKey),
      )
      .filter((dish): dish is EditableDish => Boolean(dish));
  }

  return dishes.filter((dish) => order.items.includes(dish.name));
}

export function getOrderLines(
  order: OrderRecord,
  dishes: EditableDish[],
): OrderLine[] {
  if (order.orderLines) {
    return order.orderLines;
  }

  const dishKeys =
    order.dishKeys ?? getOrderDishes(order, dishes).map(getEditableDishKey);
  const lineByDishKey = new Map<string, OrderLine>();

  dishKeys.forEach((dishKey) => {
    const currentLine = lineByDishKey.get(dishKey);
    lineByDishKey.set(dishKey, {
      dishKey,
      quantity: (currentLine?.quantity ?? 0) + 1,
    });
  });

  return Array.from(lineByDishKey.values());
}

export function getOrderItemsLabel(
  orderLines: OrderLine[],
  dishes: EditableDish[],
) {
  return orderLines
    .map((orderLine) => {
      const dish = dishes.find(
        (menuDish) => getEditableDishKey(menuDish) === orderLine.dishKey,
      );

      return dish ? `${orderLine.quantity}x ${dish.name}` : "";
    })
    .filter(Boolean)
    .join(", ");
}

export function parseNumber(value: string) {
  const parsedValue = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function formatStock(value: number) {
  const roundedValue = Math.max(0, Math.round(value * 1000) / 1000);
  return Number.isInteger(roundedValue)
    ? String(roundedValue)
    : String(roundedValue).replace(".", ",");
}

export function convertRecipeQuantityToSupplyUnit(
  recipeSupply: RecipeSupply,
  supplyUnit: string,
) {
  const quantity = parseNumber(recipeSupply.quantity);
  const recipeUnit = recipeSupply.unit.toLowerCase();
  const normalizedSupplyUnit = supplyUnit.toLowerCase();

  if (recipeUnit === normalizedSupplyUnit) {
    return quantity;
  }

  if (recipeUnit === "g" && normalizedSupplyUnit === "kg") {
    return quantity / 1000;
  }

  if (recipeUnit === "kg" && normalizedSupplyUnit === "g") {
    return quantity * 1000;
  }

  if (recipeUnit === "ml" && normalizedSupplyUnit === "l") {
    return quantity / 1000;
  }

  if (recipeUnit === "l" && normalizedSupplyUnit === "ml") {
    return quantity * 1000;
  }

  return quantity;
}

export function updateSuppliesForDishQuantityChange(
  supplies: SupplyRecord[],
  dish: EditableDish,
  quantityDelta: number,
  removedIngredients: string[] = [],
) {
  if (quantityDelta === 0) {
    return supplies;
  }

  return supplies.map((supply) => {
    const recipeSupply = getDishRecipeSupplies(dish).find(
      (currentRecipeSupply) =>
        currentRecipeSupply.supplyName.toLowerCase() ===
        supply.name.toLowerCase(),
    );

    if (!recipeSupply || removedIngredients.includes(recipeSupply.supplyName)) {
      return supply;
    }

    const quantityToDiscount =
      convertRecipeQuantityToSupplyUnit(recipeSupply, supply.unit) *
      quantityDelta;
    const nextStock = parseNumber(supply.stock) - quantityToDiscount;

    return {
      ...supply,
      stock: formatStock(nextStock),
    };
  });
}

export function updateSupplyForSingleRecipeSupply(
  supplies: SupplyRecord[],
  dish: EditableDish,
  supplyName: string,
  quantityDelta: number,
) {
  return supplies.map((supply) => {
    const recipeSupply = getDishRecipeSupplies(dish).find(
      (currentRecipeSupply) =>
        currentRecipeSupply.supplyName.toLowerCase() ===
          supply.name.toLowerCase() &&
        currentRecipeSupply.supplyName.toLowerCase() ===
          supplyName.toLowerCase(),
    );

    if (!recipeSupply) {
      return supply;
    }

    const quantityToDiscount =
      convertRecipeQuantityToSupplyUnit(recipeSupply, supply.unit) *
      quantityDelta;

    return {
      ...supply,
      stock: formatStock(parseNumber(supply.stock) - quantityToDiscount),
    };
  });
}

export function updateSuppliesForOrderRemoval(
  supplies: SupplyRecord[],
  order: OrderRecord,
  dishes: EditableDish[],
) {
  return getOrderLines(order, dishes).reduce((nextSupplies, orderLine) => {
    const dish = dishes.find(
      (menuDish) => getEditableDishKey(menuDish) === orderLine.dishKey,
    );

    if (!dish) {
      return nextSupplies;
    }

    return updateSuppliesForDishQuantityChange(
      nextSupplies,
      dish,
      -orderLine.quantity,
      order.removedIngredientsByDish?.[orderLine.dishKey] ?? [],
    );
  }, supplies);
}

export function updateSuppliesForOrderConfirmation(
  supplies: SupplyRecord[],
  order: OrderRecord,
  dishes: EditableDish[],
) {
  return getOrderLines(order, dishes).reduce((nextSupplies, orderLine) => {
    const dish = dishes.find(
      (menuDish) => getEditableDishKey(menuDish) === orderLine.dishKey,
    );

    if (!dish) {
      return nextSupplies;
    }

    return updateSuppliesForDishQuantityChange(
      nextSupplies,
      dish,
      orderLine.quantity,
      order.removedIngredientsByDish?.[orderLine.dishKey] ?? [],
    );
  }, supplies);
}
