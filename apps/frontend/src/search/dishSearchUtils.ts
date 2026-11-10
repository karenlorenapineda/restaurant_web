import type { EditableDish } from "../menuStore";
import { t, type Locale } from "../i18n";

export type SearchOptions = {
  query: string;
  category: string;
  availability: string;
  sort: string;
  minPrice: string;
  maxPrice: string;
  pageSize: number;
};
export const defaultSearch: SearchOptions = {
  query: "",
  category: "",
  availability: "all",
  sort: "name-asc",
  minPrice: "",
  maxPrice: "",
  pageSize: 6,
};
export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
// Menu prices are stored as COP strings (for example "$28.000 COP").
export function dishPrice(value: string): number {
  const cleaned = value.replace(/[^\d.,]/g, "");
  const normalized =
    /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(cleaned) || /^\d+,\d{1,2}$/.test(cleaned)
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(/,/g, "");
  return normalized ? Number(normalized) : NaN;
}
export function searchDishes(
  dishes: EditableDish[],
  options: SearchOptions,
  locale: Locale,
) {
  const terms = normalizeSearch(options.query).split(/\s+/).filter(Boolean);
  const min = options.minPrice === "" ? -Infinity : Number(options.minPrice);
  const max = options.maxPrice === "" ? Infinity : Number(options.maxPrice);
  const invalidRange =
    (options.minPrice !== "" && min < 0) ||
    (options.maxPrice !== "" && max < 0) ||
    min > max ||
    Number.isNaN(min) ||
    Number.isNaN(max);
  const results = invalidRange
    ? []
    : dishes.filter((dish) => {
        const haystack = normalizeSearch(
          [
            dish.name,
            dish.description,
            dish.categoryTitle,
            t(dish.name),
            t(dish.description),
            t(dish.categoryTitle),
          ].join(" "),
        );
        const price = dishPrice(dish.price);
        return (
          terms.every((term) => haystack.includes(term)) &&
          (!options.category || dish.categoryTitle === options.category) &&
          (options.availability === "all" ||
            Boolean(dish.available) ===
              (options.availability === "available")) &&
          ((options.minPrice === "" && options.maxPrice === "") ||
            (Number.isFinite(price) && price >= min && price <= max))
        );
      });
  const collator = new Intl.Collator(locale, {
    sensitivity: "base",
    numeric: true,
  });
  results.sort((a, b) => {
    const byName = collator.compare(t(a.name), t(b.name));
    if (options.sort.startsWith("price")) {
      const pa = dishPrice(a.price),
        pb = dishPrice(b.price);
      if (!Number.isFinite(pa)) return Number.isFinite(pb) ? 1 : byName;
      if (!Number.isFinite(pb)) return -1;
      return (options.sort === "price-asc" ? pa - pb : pb - pa) || byName;
    }
    return options.sort === "name-desc" ? -byName : byName;
  });
  return { results, invalidRange };
}
