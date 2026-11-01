import type { MenuSection } from "../data/menu";

function isMenuSection(value: unknown): value is MenuSection {
  if (!value || typeof value !== "object") {
    return false;
  }

  const section = value as Record<string, unknown>;

  return (
    typeof section.title === "string" &&
    Array.isArray(section.items) &&
    section.items.every((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const dish = item as Record<string, unknown>;

      return (
        Number.isSafeInteger(dish.id) &&
        Number(dish.id) > 0 &&
        typeof dish.name === "string" &&
        (typeof dish.description === "string" || dish.description === null) &&
        typeof dish.price === "string" &&
        (dish.image === undefined ||
          dish.image === null ||
          typeof dish.image === "string") &&
        ["available", "featured", "showImage"].every(
          (key) => dish[key] === undefined || typeof dish[key] === "boolean",
        )
      );
    })
  );
}

export async function fetchMenu(signal?: AbortSignal) {
  const response = await fetch("/api/menu", {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error("Menu request failed");
  }

  const menu: unknown = await response.json();

  if (!Array.isArray(menu) || !menu.every(isMenuSection)) {
    throw new Error("Invalid menu response");
  }

  return menu.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      description: item.description ?? "",
      ...(item.image === null ? { image: undefined } : {}),
    })),
  }));
}
