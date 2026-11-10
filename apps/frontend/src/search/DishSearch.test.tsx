import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { setLocale } from "../i18n";
import type { EditableDish } from "../menuStore";
import { DishSearch, SearchPagination, useDishSearch } from "./DishSearch";
const dishes: EditableDish[] = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  name: `Plato ${String(index).padStart(2, "0")}`,
  description: "limón",
  categoryTitle: "Entradas",
  price: `$${index + 1}.000 COP`,
  available: index !== 0,
}));
function Harness({ items = dishes }: { items?: EditableDish[] }) {
  const search = useDishSearch(items);
  return (
    <>
      <DishSearch search={search} />
      <ul>
        {search.visible.map((d) => (
          <li key={d.id}>{d.name}</li>
        ))}
      </ul>
      <SearchPagination search={search} />
    </>
  );
}
afterEach(() => setLocale("es"));
it.each([
  ["Buscar platos", "Plato 13", ""],
  ["Filtrar por categoría", "Entradas", ""],
  ["Disponibilidad", "available", "all"],
  ["Precio mínimo (COP)", "5000", ""],
  ["Precio máximo (COP)", "9000", ""],
  ["Ordenar por", "price-desc", "name-asc"],
  ["Resultados por página", "12", "6"],
])(
  "resets pagination when changing and restoring %s",
  (label, value, initial) => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("Página 2 / 3")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(label), { target: { value } });
    expect(screen.getByText(/^Página 1 \//)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(label), {
      target: { value: initial },
    });
    expect(screen.getByText("Página 1 / 3")).toBeInTheDocument();
  },
);
it("does not restore an old page when switching back to the original language", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  act(() => setLocale("en"));
  expect(screen.getByText("Page 1 / 3")).toBeInTheDocument();
  act(() => setLocale("es"));
  expect(screen.getByText("Página 1 / 3")).toBeInTheDocument();
});
it("keeps the clamped page after deleted dishes are replaced", () => {
  const view = render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  view.rerender(<Harness items={dishes.slice(0, 2)} />);
  expect(screen.getByText("Página 1 / 1")).toBeInTheDocument();
  view.rerender(<Harness />);
  expect(screen.getByText("Página 1 / 3")).toBeInTheDocument();
});
it("paginates, resets on filters, validates prices, clears and clamps after deletion", () => {
  const view = render(<Harness />);
  expect(screen.getAllByRole("listitem")).toHaveLength(6);
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(screen.getByText("Página 2 / 3")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Buscar platos"), {
    target: { value: "Plato 13" },
  });
  expect(screen.getAllByRole("listitem")).toHaveLength(1);
  expect(screen.getByText("Página 1 / 1")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Precio mínimo (COP)"), {
    target: { value: "40" },
  });
  fireEvent.change(screen.getByLabelText("Precio máximo (COP)"), {
    target: { value: "20" },
  });
  expect(screen.getByRole("alert")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  view.rerender(<Harness items={dishes.slice(0, 2)} />);
  expect(screen.getByText("Página 1 / 1")).toBeInTheDocument();
});
it("switches all search labels immediately while retaining entered text", () => {
  render(<Harness />);
  fireEvent.change(screen.getByLabelText("Buscar platos"), {
    target: { value: "limon" },
  });
  act(() => setLocale("en"));
  expect(screen.getByLabelText("Search dishes")).toHaveValue("limon");
  expect(
    screen.getByRole("button", { name: "Clear filters" }),
  ).toBeInTheDocument();
  act(() => setLocale("pt"));
  expect(screen.getByLabelText("Pesquisar pratos")).toHaveValue("limon");
  expect(
    screen.getByRole("button", { name: "Limpar filtros" }),
  ).toBeInTheDocument();
});
