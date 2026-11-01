import { useState } from "react";
import { t, useLocale } from "../i18n";
import type { EditableDish } from "../menuStore";
import { Button, Input, Select } from "../components/ui/controls";
import { Field } from "../features/employee-panel/shared";
import { defaultSearch, searchDishes, type SearchOptions } from "./dishSearch";

export function useDishSearch(dishes: EditableDish[], publicMenu = false) {
  const locale = useLocale();
  const [options, setOptions] = useState<SearchOptions>({
    ...defaultSearch,
    availability: publicMenu ? "available" : "all",
  });
  const [pageState, setPage] = useState({ signature: "", page: 1 });
  const { results, invalidRange } = searchDishes(dishes, options, locale);
  const signature = JSON.stringify([options, locale]);
  const pages = Math.max(1, Math.ceil(results.length / options.pageSize));
  const page = Math.min(
    pages,
    pageState.signature === signature ? pageState.page : 1,
  );
  const change = (key: keyof SearchOptions, value: string | number) =>
    setOptions((current) => ({ ...current, [key]: value }));
  return {
    options,
    change,
    invalidRange,
    page,
    pages,
    total: results.length,
    visible: results.slice(
      (page - 1) * options.pageSize,
      page * options.pageSize,
    ),
    categories: [...new Set(dishes.map((dish) => dish.categoryTitle))],
    goTo: (next: number) =>
      setPage({ signature, page: Math.max(1, Math.min(pages, next)) }),
    clear: () => {
      setOptions({
        ...defaultSearch,
        availability: publicMenu ? "available" : "all",
      });
      setPage({ signature: "", page: 1 });
    },
  };
}
export function DishSearch({
  search,
  publicMenu = false,
}: {
  search: ReturnType<typeof useDishSearch>;
  publicMenu?: boolean;
}) {
  useLocale();
  const { options, change } = search;
  return (
    <div className="mt-5 grid gap-4 rounded-sm border border-white/10 bg-black/20 p-4">
      <Field label={t("Buscar platos")}>
        <Input
          type="search"
          maxLength={160}
          value={options.query}
          placeholder={t("Nombre o descripción")}
          onChange={(e) => change("query", e.target.value)}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("Filtrar por categoría")}>
          <Select
            value={options.category}
            onChange={(e) => change("category", e.target.value)}
          >
            <option value="">{t("Todas las categorías")}</option>
            {search.categories.map((category) => (
              <option key={category} value={category}>
                {t(category)}
              </option>
            ))}
          </Select>
        </Field>
        {!publicMenu && (
          <Field label={t("Disponibilidad")}>
            <Select
              value={options.availability}
              onChange={(e) => change("availability", e.target.value)}
            >
              <option value="all">{t("Todos")}</option>
              <option value="available">{t("Disponible")}</option>
              <option value="unavailable">{t("No disponible")}</option>
            </Select>
          </Field>
        )}
        <Field label={t("Precio mínimo (COP)")}>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={options.minPrice}
            invalid={search.invalidRange}
            onChange={(e) => change("minPrice", e.target.value)}
          />
        </Field>
        <Field label={t("Precio máximo (COP)")}>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={options.maxPrice}
            invalid={search.invalidRange}
            onChange={(e) => change("maxPrice", e.target.value)}
          />
        </Field>
        <Field label={t("Ordenar por")}>
          <Select
            value={options.sort}
            onChange={(e) => change("sort", e.target.value)}
          >
            {(
              [
                ["name-asc", "Nombre: A–Z"],
                ["name-desc", "Nombre: Z–A"],
                ["price-asc", "Precio: menor a mayor"],
                ["price-desc", "Precio: mayor a menor"],
              ] as const
            ).map(([value, label]) => (
              <option key={value} value={value}>
                {t(label)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("Resultados por página")}>
          <Select
            value={options.pageSize}
            onChange={(e) => change("pageSize", Number(e.target.value))}
          >
            {[6, 12, 24].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {search.invalidRange && (
        <p role="alert" className="text-sm text-red-300">
          {t("Introduce un rango de precios válido.")}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm text-zinc-300">
          {t("Resultados")}: {search.total}
        </p>
        <Button variant="secondary" onClick={search.clear}>
          {t("Limpiar filtros")}
        </Button>
      </div>
    </div>
  );
}
export function SearchPagination({
  search,
}: {
  search: ReturnType<typeof useDishSearch>;
}) {
  useLocale();
  return (
    <nav
      aria-label={t("Paginación de platos")}
      className="mt-5 flex flex-wrap items-center justify-between gap-3"
    >
      <Button
        variant="secondary"
        disabled={search.page <= 1}
        onClick={() => search.goTo(search.page - 1)}
      >
        {t("Anterior")}
      </Button>
      <span className="text-sm text-zinc-300">
        {t("Página")} {search.page} / {search.pages}
      </span>
      <Button
        variant="secondary"
        disabled={search.page >= search.pages}
        onClick={() => search.goTo(search.page + 1)}
      >
        {t("Siguiente")}
      </Button>
    </nav>
  );
}
