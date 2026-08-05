import { menuSections } from "./data/menu";
import type { Dish, MenuSection } from "./data/menu";

const MENU_STORAGE_KEY = "picasso.employeeMenu";
const FEATURED_STORAGE_KEY = "picasso.featuredDishes";
const GALLERY_STORAGE_KEY = "picasso.galleryDishes";
const DEFAULT_FEATURED_KEYS = ["201", "202", "203"];
const DEFAULT_FEATURED_NAMES = [
  "Bandeja paisa familiar",
  "Pollo asado colombiano",
  "Sancocho trifasico",
  "Bandeja paisa",
  "Sancocho de gallina",
  "Empanadas vallunas",
];
const DEFAULT_GALLERY_NAMES = [
  "Bandeja paisa familiar",
  "Pollo asado colombiano",
  "Sancocho trifasico",
  "Empanadas vallunas",
];

export interface EditableDish extends Dish {
  categoryTitle: string;
  available: boolean;
}

export function getEditableDishKey(dish: Dish) {
  return String(dish.id ?? dish.name);
}

export function flattenMenu(sections: MenuSection[]) {
  return sections.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      available: item.available ?? true,
      categoryTitle: section.title,
    })),
  );
}

export function loadStoredMenu() {
  const storedMenu = window.localStorage.getItem(MENU_STORAGE_KEY);

  if (!storedMenu) {
    return null;
  }

  try {
    return JSON.parse(storedMenu) as MenuSection[];
  } catch {
    window.localStorage.removeItem(MENU_STORAGE_KEY);
    return null;
  }
}

export function loadFeaturedDishKeys() {
  const storedKeys = window.localStorage.getItem(FEATURED_STORAGE_KEY);

  if (!storedKeys) {
    return [];
  }

  try {
    return JSON.parse(storedKeys) as string[];
  } catch {
    window.localStorage.removeItem(FEATURED_STORAGE_KEY);
    return [];
  }
}

export function loadGalleryDishKeys() {
  const storedKeys = window.localStorage.getItem(GALLERY_STORAGE_KEY);

  if (!storedKeys) {
    return [];
  }

  try {
    return JSON.parse(storedKeys) as string[];
  } catch {
    window.localStorage.removeItem(GALLERY_STORAGE_KEY);
    return [];
  }
}

export function saveFeaturedDishKeys(keys: string[]) {
  window.localStorage.setItem(FEATURED_STORAGE_KEY, JSON.stringify(keys));
  window.dispatchEvent(new Event("picasso-menu-updated"));
}

export function saveGalleryDishKeys(keys: string[]) {
  window.localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(keys));
  window.dispatchEvent(new Event("picasso-menu-updated"));
}

export function saveStoredMenu(sections: MenuSection[]) {
  window.localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(sections));
  window.dispatchEvent(new Event("picasso-menu-updated"));
}

export function getMenuForEditing() {
  return loadStoredMenu() ?? menuSections;
}

export function updateDishInSections(
  sections: MenuSection[],
  dishKey: string,
  nextDish: EditableDish,
) {
  const editedDish = {
    available: nextDish.available,
    description: nextDish.description,
    id: nextDish.id,
    image: nextDish.image,
    name: nextDish.name,
    price: nextDish.price,
    recipe: nextDish.recipe,
    recipeIngredients: nextDish.recipeIngredients,
    recipeSupplies: nextDish.recipeSupplies,
  };

  return sections.map((section) => {
    const itemsWithoutEditedDish = section.items.filter(
      (item) => getEditableDishKey(item) !== dishKey,
    );

    return {
      ...section,
      items:
        section.title === nextDish.categoryTitle
          ? [...itemsWithoutEditedDish, editedDish]
          : itemsWithoutEditedDish,
    };
  });
}

export function addDishToSections(sections: MenuSection[], dish: EditableDish) {
  return sections.map((section) => ({
    ...section,
    items:
      section.title === dish.categoryTitle
        ? [
            ...section.items,
            {
              available: dish.available,
              description: dish.description,
              id: dish.id,
              image: dish.image,
              name: dish.name,
              price: dish.price,
              recipe: dish.recipe,
              recipeIngredients: dish.recipeIngredients,
              recipeSupplies: dish.recipeSupplies,
            },
          ]
        : section.items,
  }));
}

export function getFeaturedDishes(sections: MenuSection[]) {
  const dishes = flattenMenu(sections).filter((dish) => dish.available);
  const keys = loadFeaturedDishKeys();
  const featuredDishes = keys
    .map((key) => dishes.find((dish) => getEditableDishKey(dish) === key))
    .filter((dish): dish is EditableDish => Boolean(dish));

  if (featuredDishes.length > 0) {
    return featuredDishes;
  }

  const defaultFeaturedDishes = [
    ...DEFAULT_FEATURED_KEYS,
    ...DEFAULT_FEATURED_NAMES,
  ]
    .map((keyOrName) =>
      dishes.find(
        (dish) =>
          getEditableDishKey(dish) === keyOrName || dish.name === keyOrName,
      ),
    )
    .filter((dish): dish is EditableDish => Boolean(dish));

  return defaultFeaturedDishes.length > 0
    ? defaultFeaturedDishes.slice(0, 3)
    : dishes.slice(0, 3);
}

export function getGalleryDishes(sections: MenuSection[]) {
  const dishes = flattenMenu(sections).filter((dish) => dish.available);
  const keys = loadGalleryDishKeys();
  const selectedGalleryDishes = keys
    .map((key) => dishes.find((dish) => getEditableDishKey(dish) === key))
    .filter((dish): dish is EditableDish => Boolean(dish));

  if (selectedGalleryDishes.length > 0) {
    return selectedGalleryDishes;
  }

  const defaultGalleryDishes = DEFAULT_GALLERY_NAMES.map((name) =>
    dishes.find((dish) => dish.name === name),
  ).filter((dish): dish is EditableDish => Boolean(dish));

  return defaultGalleryDishes.length > 0
    ? defaultGalleryDishes
    : dishes.slice(0, 4);
}

export function isFeaturedDish(dish: Dish, keys = loadFeaturedDishKeys()) {
  return keys.includes(getEditableDishKey(dish));
}

export function isGalleryDish(dish: Dish, keys = loadGalleryDishKeys()) {
  return keys.includes(getEditableDishKey(dish));
}

export function countExistingSelectedDishes(keys: string[], dishes: Dish[]) {
  const dishKeys = new Set(dishes.map((dish) => getEditableDishKey(dish)));

  return keys.filter((key) => dishKeys.has(key)).length;
}

export function setSelectedDishKey(
  dish: Dish,
  isSelected: boolean,
  keys: string[],
) {
  const key = getEditableDishKey(dish);

  if (isSelected) {
    return keys.includes(key) ? keys : [...keys, key];
  }

  return keys.filter((currentKey) => currentKey !== key);
}

export function setFeaturedDish(
  dish: Dish,
  isFeatured: boolean,
  keys = loadFeaturedDishKeys(),
) {
  return setSelectedDishKey(dish, isFeatured, keys);
}

export function setGalleryDish(
  dish: Dish,
  isGalleryDishSelected: boolean,
  keys = loadGalleryDishKeys(),
) {
  return setSelectedDishKey(dish, isGalleryDishSelected, keys);
}
