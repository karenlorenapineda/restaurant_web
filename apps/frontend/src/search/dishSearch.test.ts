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
  });
  it.each([
    ["$12,5 COP", 12.5],
    ["$999,99 COP", 999.99],
    ["$0,01 COP", 0.01],
    ["$1234,50 COP", 1234.5],
    ["$1.234,50 COP", 1234.5],
    ["$28.000 COP", 28000],
    ["$1,234.50 COP", 1234.5],
    ["$1,234 COP", 1234],
    ["$12.50 COP", 12.5],
  ])("parses %s as %s", (value, expected) => {
    expect(dishPrice(value)).toBe(expected);
  });
  it("filters and sorts decimal COP prices below one thousand", () => {
    const decimalDishes = [
      { ...dishes[0]!, price: "$12,5 COP" },
      { ...dishes[1]!, price: "$100 COP" },
      { ...dishes[2]!, price: "$9,99 COP" },
    ];
    expect(
      searchDishes(
        decimalDishes,
        { ...defaultSearch, sort: "price-asc" },
        "es",
      ).results.map((dish) => dish.id),
    ).toEqual([3, 1, 2]);
    expect(
      searchDishes(
        decimalDishes,
        { ...defaultSearch, minPrice: "12.5", maxPrice: "12.5" },
        "es",
      ).results.map((dish) => dish.id),
    ).toEqual([1]);
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
