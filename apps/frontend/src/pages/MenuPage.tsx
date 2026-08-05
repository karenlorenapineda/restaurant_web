import { useEffect, useMemo, useState } from "react";

import { fetchMenu } from "../api/menu";
import { menuSections } from "../data/menu";
import type { Dish, MenuSection } from "../data/menu";
import { flattenMenu, getEditableDishKey, loadStoredMenu } from "../menuStore";
import type { NavigationHandlers } from "../navigation";

function getDishKey(dish: Dish) {
  return getEditableDishKey(dish);
}

export function MenuPage({
  navigate,
}: Pick<NavigationHandlers, "navigate">) {
  const [sections, setSections] = useState<MenuSection[]>(
    loadStoredMenu() ?? menuSections,
  );
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedDishKey, setSelectedDishKey] = useState<string | null>(null);
  const [menuStatus, setMenuStatus] = useState<"loading" | "ready" | "fallback">(
    "loading",
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadMenu() {
      const storedMenu = loadStoredMenu();

      if (storedMenu) {
        setSections(storedMenu);
        setMenuStatus("ready");
        return;
      }

      try {
        const apiSections = await fetchMenu(controller.signal);
        if (!controller.signal.aborted && apiSections.length > 0) {
          setSections(apiSections);
          setMenuStatus("ready");
        }
      } catch {
        if (!controller.signal.aborted) {
          setMenuStatus("fallback");
        }
      }
    }

    void loadMenu();

    function syncStoredMenu() {
      setSections(loadStoredMenu() ?? menuSections);
    }

    window.addEventListener("picasso-menu-updated", syncStoredMenu);

    return () => {
      controller.abort();
      window.removeEventListener("picasso-menu-updated", syncStoredMenu);
    };
  }, []);

  const categories = useMemo(
    () => ["Todos", ...sections.map((section) => section.title)],
    [sections],
  );

  const dishes = useMemo(() => flattenMenu(sections), [sections]);
  const visibleDishes = dishes.filter(
    (dish) =>
      dish.available &&
      (selectedCategory === "Todos" || dish.categoryTitle === selectedCategory),
  );
  const selectedDish = visibleDishes.find(
    (dish) => getDishKey(dish) === selectedDishKey,
  );

  function selectCategory(category: string) {
    setSelectedCategory(category);
    setSelectedDishKey(null);
  }

  return (
    <section className="min-h-[100svh] bg-[#242424] px-5 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36">
      <div className="mx-auto max-w-7xl">
        <a
          className="text-sm font-semibold text-[#e8b45f] transition hover:text-white sm:text-base"
          href="/"
          onClick={(event) => navigate("/", event)}
        >
          Volver al inicio
        </a>

        <div className="mt-8 max-w-4xl sm:mt-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#e8b45f] sm:text-base">
            Carta del asadero
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold sm:mt-5 sm:text-8xl">
            Menu familiar
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-300 sm:mt-8 sm:text-lg sm:leading-9">
            Elige un plato para verlo en grande. Carnes al asador, entradas
            caseras y bebidas para acompanar la mesa.
          </p>
          {menuStatus === "fallback" ? (
              <p className="mt-4 text-sm font-semibold text-[#e8b45f]">
              Mostrando menu de ejemplo mientras se conecta la base de datos.
            </p>
          ) : null}
        </div>

        <div className="mt-10 flex flex-wrap gap-3 sm:mt-16 sm:gap-4">
          {categories.map((category) => (
            <button
              className={`rounded-sm px-4 py-2 text-sm font-bold transition sm:px-5 sm:py-3 sm:text-base ${
                selectedCategory === category
                  ? "bg-[#e8b45f] text-zinc-950"
                  : "border border-zinc-700 bg-[#333333] text-zinc-300 hover:border-[#e8b45f]"
              }`}
              key={category}
              onClick={() => selectCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 sm:mt-10 md:grid-cols-2 md:gap-9 xl:grid-cols-3">
          {visibleDishes.map((dish) => (
            <button
              className={`overflow-hidden rounded-lg border text-left shadow-xl shadow-black/25 transition hover:-translate-y-1 ${
                getDishKey(dish) === selectedDishKey
                  ? "border-[#e8b45f] bg-[#333333]"
                  : "border-zinc-700 bg-[#333333]"
              }`}
              key={getDishKey(dish)}
              onClick={() => setSelectedDishKey(getDishKey(dish))}
              type="button"
            >
              <img
                alt={dish.name}
                className="h-64 w-full object-cover sm:h-80"
                src={
                  dish.image ??
                  "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=900&q=85"
                }
              />
              <div className="p-5 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#e8b45f] sm:text-sm">
                  {dish.categoryTitle}
                </p>
                <div className="mt-2 flex items-start justify-between gap-4">
                  <h3 className="font-display text-2xl font-bold sm:text-3xl">
                    {dish.name}
                  </h3>
                  <span className="whitespace-nowrap text-sm font-bold text-[#e8b45f] sm:text-base">
                    {dish.price}
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400 sm:mt-4 sm:text-base sm:leading-7">
                  {dish.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedDish ? (
        <div
          className="fixed inset-0 z-30 grid place-items-center bg-black/70 px-5 py-10 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="selected-dish-title"
        >
          <article className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-sm border border-zinc-700 bg-[#242424] shadow-2xl shadow-black/60">
            <img
              alt={selectedDish.name}
              className="h-[min(44vh,420px)] w-full object-cover"
              src={
                selectedDish.image ??
                "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1200&q=85"
              }
            />
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-sm font-semibold uppercase text-[#e8b45f]">
                    {selectedDish.categoryTitle}
                  </p>
                  <h2
                    className="mt-3 font-display text-4xl font-bold sm:text-5xl"
                    id="selected-dish-title"
                  >
                    {selectedDish.name}
                  </h2>
                </div>
                <button
                  aria-label="Cerrar detalle del plato"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-zinc-700 text-lg font-bold text-zinc-200 transition hover:border-[#e8b45f]"
                  onClick={() => setSelectedDishKey(null)}
                  type="button"
                >
                  x
                </button>
              </div>
              <p className="mt-5 max-w-2xl leading-8 text-zinc-300">
                {selectedDish.description}
              </p>
              <p className="mt-6 text-2xl font-bold text-[#e8b45f]">
                {selectedDish.price}
              </p>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
