import { request } from "./client";
import type { Row } from "./client";
export interface RecipeIngredient extends Row {
  ingredientId: number;
  unitId: number;
  quantity: string;
  supplyName: string;
  unit: string;
}
export interface RecipeGroup {
  itemId: number;
  name: string;
  recipe: string | null;
  ingredients: RecipeIngredient[];
}
export async function fetchRecipes(
  signal?: AbortSignal,
): Promise<Record<string, RecipeGroup>> {
  const payload = await request<unknown>("recipes", { signal });
  const positive = (value: unknown) =>
    typeof value === "number" && Number.isSafeInteger(value) && value > 0;
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    !Object.entries(payload).every(([key, value]) => {
      if (!value || typeof value !== "object") return false;
      const group = value as RecipeGroup;
      return (
        positive(group.itemId) &&
        key === String(group.itemId) &&
        typeof group.name === "string" &&
        (group.recipe === null || typeof group.recipe === "string") &&
        Array.isArray(group.ingredients) &&
        group.ingredients.every(
          (ingredient) =>
            ingredient &&
            positive(ingredient.id) &&
            positive(ingredient.ingredientId) &&
            positive(ingredient.unitId) &&
            typeof ingredient.quantity === "string" &&
            Number.isFinite(Number(ingredient.quantity)) &&
            Number(ingredient.quantity) >= 0 &&
            typeof ingredient.supplyName === "string" &&
            typeof ingredient.unit === "string",
        )
      );
    })
  )
    throw new Error("Invalid recipe response");
  return payload as Record<string, RecipeGroup>;
}
