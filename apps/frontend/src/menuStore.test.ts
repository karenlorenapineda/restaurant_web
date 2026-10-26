import { describe, expect, it } from "vitest";

import type { MenuSection } from "./data/menu";
import {
  addDishToSections,
  flattenMenu,
  setFeaturedDish,
  updateDishInSections,
} from "./menuStore";

const sections: MenuSection[] = [
  {
    title: "Starters",
    items: [
      {
        id: 1,
        description: "Original description",
        name: "Original dish",
        price: "$10",
      },
    ],
  },
  {
    title: "Mains",
    items: [],
  },
];

describe("menuStore", () => {
  it("flattens menu sections with category and availability metadata", () => {
    expect(flattenMenu(sections)).toEqual([
      expect.objectContaining({
        available: true,
        categoryTitle: "Starters",
        id: 1,
        name: "Original dish",
      }),
    ]);
  });

  it("moves an edited dish to its selected category", () => {
    const nextSections = updateDishInSections(sections, "1", {
      available: false,
      categoryTitle: "Mains",
      description: "Updated description",
      id: 1,
      name: "Updated dish",
      price: "$12",
    });

    expect(nextSections.at(0)?.items).toHaveLength(0);
    expect(nextSections.at(1)?.items).toEqual([
      expect.objectContaining({
        available: false,
        description: "Updated description",
        name: "Updated dish",
      }),
    ]);
  });

  it("adds a dish only to the matching category", () => {
    const nextSections = addDishToSections(sections, {
      available: true,
      categoryTitle: "Mains",
      description: "New description",
      id: 2,
      name: "New dish",
      price: "$14",
    });

    expect(nextSections.at(0)?.items).toHaveLength(1);
    expect(nextSections.at(1)?.items).toEqual([
      expect.objectContaining({ id: 2, name: "New dish" }),
    ]);
  });

  it("does not duplicate selected featured dishes", () => {
    const dish = { id: 1, description: "", name: "Dish", price: "$10" };

    expect(setFeaturedDish(dish, true, ["1"])).toEqual(["1"]);
    expect(setFeaturedDish(dish, false, ["1", "2"])).toEqual(["2"]);
  });
});
