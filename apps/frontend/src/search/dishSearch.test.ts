import { afterEach, describe, expect, it } from "vitest";
import { setLocale } from "../i18n";
import type { EditableDish } from "../menuStore";
import { defaultSearch, dishPrice, searchDishes } from "./dishSearch";
const dishes: EditableDish[] = [
  {
    id: 1,
    name: "Pollo asado colombiano",
    description: "Limón fresco",
    categoryTitle: "Platos colombianos",
    price: "$28.000 COP",
    available: true,
  },
  {
    id: 2,
    name: "Entrada criolla",
    description: "Crujiente",
    categoryTitle: "Entradas",
    price: "$9.000 COP",
    available: false,
  },
  {
    id: 3,
    name: "Aborrajado",
    description: "Limón fresco",
    categoryTitle: "Entradas",
    price: "$12.000 COP",
    available: true,
  },
];
afterEach(() => setLocale("es"));
describe("dish search", () => {
  it("combines accent-insensitive terms, category, availability and inclusive price bounds", () => {
    const result = searchDishes(
      dishes,
      {
        ...defaultSearch,
        query: "LIMON fresco",
        category: "Entradas",
        availability: "available",
        minPrice: "12000",
        maxPrice: "12000",
      },
      "es",
    );
    expect(result.invalidRange).toBe(false);
    expect(result.results.map((d) => d.id)).toEqual([3]);
  });
  it("keeps empty price bounds valid and sorts COP numerically without mutating the input", () => {
    expect(
      searchDishes(
        dishes,
        { ...defaultSearch, sort: "price-asc" },
        "es",
      ).results.map((d) => d.id),
    ).toEqual([2, 3, 1]);
    expect(
      searchDishes(
        dishes,
        { ...defaultSearch, sort: "price-desc" },
        "es",
      ).results.map((d) => d.id),
    ).toEqual([1, 3, 2]);
    expect(dishes.map((d) => d.id)).toEqual([1, 2, 3]);
    expect(dishPrice("$28.000 COP")).toBe(28000);
    expect(dishPrice("$1,234.50 COP")).toBe(1234.5);
  });
  it("searches translated names in English and Portuguese", () => {
    setLocale("en");
    expect(
      searchDishes(
        dishes,
        { ...defaultSearch, query: "roast chicken" },
        "en",
      ).results.map((d) => d.id),
    ).toEqual([1]);
    setLocale("pt");
    expect(
      searchDishes(
        dishes,
        { ...defaultSearch, query: "frango" },
        "pt",
      ).results.map((d) => d.id),
    ).toEqual([1]);
  });
  it("reports invalid price ranges and excludes unknown prices when bounded", () => {
    expect(
      searchDishes(
        dishes,
        { ...defaultSearch, minPrice: "20", maxPrice: "10" },
        "es",
      ),
    ).toEqual({ results: [], invalidRange: true });
    expect(
      searchDishes(dishes, { ...defaultSearch, minPrice: "-1" }, "es")
        .invalidRange,
    ).toBe(true);
  });
});
