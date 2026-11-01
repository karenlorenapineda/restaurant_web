export interface RecipeSupply {
  id?: number;
  ingredientId?: number;
  unitId?: number;
  quantity: string;
  supplyName: string;
  unit: string;
}

export interface Dish {
  categoryId?: number;
  id?: number;
  name: string;
  description: string;
  price: string;
  image?: string;
  available?: boolean;
  featured?: boolean;
  showImage?: boolean;
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
