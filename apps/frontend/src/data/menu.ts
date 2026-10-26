export interface RecipeSupply {
  quantity: string;
  supplyName: string;
  unit: string;
}

export interface Dish {
  id?: number;
  name: string;
  description: string;
  price: string;
  image?: string;
  available?: boolean;
  recipe?: string;
  recipeIngredients?: string[];
  recipeSupplies?: RecipeSupply[];
}

export interface MenuSection {
  id?: number;
  title: string;
  description?: string | null;
  items: Dish[];
}

export {
  mockFeaturedDishes as featuredDishes,
  mockMenuSections as menuSections,
} from "../mocks/menu";
