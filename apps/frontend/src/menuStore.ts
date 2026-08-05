import { menuSections } from "./data/menu";
import type { Dish, MenuSection } from "./data/menu";

const MENU_STORAGE_KEY = "picasso.employeeMenu";

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
            },
          ]
        : section.items,
  }));
}
