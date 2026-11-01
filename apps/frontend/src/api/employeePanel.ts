import { listRows, parseCop } from "./client";
import type { Row } from "./client";
import { fetchRecipes } from "./recipes";
import type { RecipeGroup } from "./recipes";
import type { MenuSection } from "../data/menu";
import type {
  EmployeeRecord,
  OrderRecord,
  SupplyRecord,
} from "../mocks/employeePanel";

export interface UnitOption {
  id: number;
  name: string;
  abbreviation: string;
  type: string;
}
export interface PanelData {
  sections: MenuSection[];
  employees: EmployeeRecord[];
  supplies: SupplyRecord[];
  inventory: SupplyRecord[];
  orders: OrderRecord[];
  units: UnitOption[];
  restaurants: { id: number; name: string }[];
  recipes: Record<string, RecipeGroup>;
}
export const emptyPanelData: PanelData = {
  sections: [],
  employees: [],
  supplies: [],
  inventory: [],
  orders: [],
  units: [],
  restaurants: [],
  recipes: {},
};
const optionalId = (value: unknown) =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : undefined;
const uniqueUnit = (row: Row, units: UnitOption[]) => {
  const matches = units.filter((unit) => unit.abbreviation === row.unit);
  return (
    optionalId(row.unitId) ??
    (matches.length === 1 ? matches[0]?.id : undefined)
  );
};
export async function fetchPanelData(signal?: AbortSignal): Promise<PanelData> {
  const [
    categories,
    menu,
    employeeRows,
    supplyRows,
    inventoryRows,
    orderRows,
    unitRows,
    restaurants,
    recipes,
  ] = await Promise.all([
    listRows("categories", signal),
    listRows("menu/management", signal),
    listRows("employees", signal),
    listRows("supplies", signal),
    listRows("inventory", signal),
    listRows("orders", signal),
    listRows("units", signal),
    listRows("restaurant", signal),
    fetchRecipes(signal),
  ]);
  const units = unitRows as unknown as UnitOption[];
  const stock = (rows: Row[]): SupplyRecord[] =>
    rows.map((row) => ({
      id: row.id,
      name: String(row.name),
      cost: String(parseCop(String(row.const))),
      stock: String(row.stock),
      threshold: String(row.threshold),
      unit: String(row.unit),
      unitId: uniqueUnit(row, units),
    }));
  const sections: MenuSection[] = categories.map((category) => ({
    id: category.id,
    title: String(category.name),
    items: menu
      .filter((dish) =>
        dish.categoryId !== undefined
          ? dish.categoryId === category.id
          : dish.category === category.name &&
            categories.filter((item) => item.name === category.name).length ===
              1,
      )
      .map((dish) => ({
        id: dish.id,
        categoryId: category.id,
        name: String(dish.name),
        description: String(dish.description ?? ""),
        price: String(dish.price),
        image:
          typeof dish.image === "string" ? dish.image : "/images/Plato01.png",
        available: Boolean(dish.active),
        featured: Boolean(dish.featured),
        showImage: Boolean(dish.showImage),
        recipe: String(dish.recipe ?? ""),
        recipeSupplies:
          recipes[String(dish.id)]?.ingredients.map((item) => ({ ...item })) ??
          [],
      })),
  }));
  const employees: EmployeeRecord[] = employeeRows.map((row) => ({
    id: row.id,
    name: String(row.name),
    active: Boolean(row.active),
    email: String(row.email),
    phone: String(row.phone ?? ""),
    position: String(row.position),
    role: "empleado",
    roleName: String(row.role),
    userId: optionalId(row.userId),
    firstName: typeof row.firstName === "string" ? row.firstName : undefined,
    lastName: typeof row.lastName === "string" ? row.lastName : undefined,
    positionId: optionalId(row.positionId),
    restaurantId: optionalId(row.restaurantId),
  }));
  const orders: OrderRecord[] = orderRows.map((row) => {
    const apiItems = row.items as NonNullable<OrderRecord["apiItems"]>;
    return {
      id: row.id,
      customer: String(row.customer),
      table: String(row.tableOrLocation),
      total: String(row.total),
      status: row.status as OrderRecord["status"],
      items: apiItems
        .map((item) => `${item.quantity} × ${item.name}`)
        .join(", "),
      notes: apiItems
        .map((item) => item.notes)
        .filter(Boolean)
        .join(" · "),
      orderLines: apiItems.map((item) => ({
        dishKey: String(item.itemId),
        quantity: item.quantity,
      })),
      removedIngredientsByDish: Object.fromEntries(
        apiItems.map((item) => [String(item.itemId), item.removedIngredients]),
      ),
      phone: String(row.customerPhone ?? ""),
      apiItems,
    };
  });
  return {
    sections,
    employees,
    supplies: stock(supplyRows),
    inventory: stock(inventoryRows),
    orders,
    units,
    restaurants: restaurants.map((item) => ({
      id: item.id,
      name: String(item.name),
    })),
    recipes,
  };
}
