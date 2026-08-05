import { useEffect, useState } from "react";

import { fetchMenu } from "../api/menu";
import { ChatWidget } from "../components/ChatWidget";
import { ContactSection } from "../components/ContactSection";
import { menuSections } from "../data/menu";
import type { MenuSection } from "../data/menu";
import { getFeaturedDishes, getGalleryDishes, loadStoredMenu } from "../menuStore";
import type { NavigationHandlers } from "../navigation";

export function HomePage({ navigate, goToContact }: NavigationHandlers) {
  const [sections, setSections] = useState<MenuSection[]>(
    loadStoredMenu() ?? menuSections,
  );
  const featuredDishes = getFeaturedDishes(sections);
  const galleryDishes = getGalleryDishes(sections);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMenu() {
      const storedMenu = loadStoredMenu();

      if (storedMenu) {
        setSections(storedMenu);
        return;
      }

      try {
        const apiSections = await fetchMenu(controller.signal);
        if (!controller.signal.aborted && apiSections.length > 0) {
          setSections(apiSections);
        }
      } catch {
        // Keep local Colombian menu when backend is unavailable.
      }
    }

    void loadMenu();

    function syncMenu() {
      setSections(loadStoredMenu() ?? menuSections);
    }

    window.addEventListener("picasso-menu-updated", syncMenu);

    return () => {
      controller.abort();
      window.removeEventListener("picasso-menu-updated", syncMenu);
    };
  }, []);

  return (
    <>
      <section className="relative grid min-h-[100svh] place-items-center overflow-hidden px-5 py-28 text-center text-white sm:px-6 sm:py-36">
        <img
          alt="Mesa familiar de restaurante con ambiente calido"
          className="absolute inset-0 h-full w-full object-cover brightness-[0.55]"
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=85"
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]" />
        <div className="relative mx-auto max-w-5xl">
          <div className="mx-auto mb-10 grid h-24 w-36 place-items-center rounded-sm border border-[#e8b45f]/50 bg-black/35 text-xs font-bold uppercase tracking-wide text-[#e8b45f] sm:mb-16 sm:h-28 sm:w-40 sm:text-sm">
            Espacio logo
          </div>
          <p className="text-sm font-bold uppercase tracking-wide text-[#e8b45f] sm:text-base">
            Restaurante y asadero familiar
          </p>
          <h1 className="mt-5 font-display text-5xl font-bold leading-tight sm:mt-7 sm:text-8xl">
            Buena comida, grandes momentos
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-zinc-200 sm:mt-8 sm:text-lg sm:leading-9">
            Platos colombianos, carnes al asador y recetas de casa para sentarse
            en familia y compartir sin prisa.
          </p>
          <a
            className="mt-9 inline-flex rounded-sm bg-[#e8b45f] px-10 py-4 text-sm font-bold text-zinc-950 transition hover:bg-white sm:mt-12 sm:px-14 sm:py-5 sm:text-base"
            href="/#contacto"
            onClick={goToContact}
          >
            Reservar mesa
          </a>
        </div>
      </section>

      <section className="flex min-h-[100svh] items-center bg-[#242424] px-5 py-24 text-center sm:px-6 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-4xl text-[#e8b45f] sm:text-5xl">
            Especiales de hoy
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:mt-5 sm:text-base sm:leading-8">
            Favoritos editables desde el panel de empleados.
          </p>

          <div className="mt-10 grid gap-6 sm:mt-16 md:grid-cols-3 md:gap-10">
            {featuredDishes.map((dish) => (
              <article
                className="overflow-hidden rounded-sm bg-[#333333] text-left shadow-xl shadow-black/25"
                key={dish.id ?? dish.name}
              >
                <img
                  alt={dish.name}
                  className="h-56 w-full object-cover sm:h-72"
                  src={
                    dish.image ??
                    "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=900&q=85"
                  }
                />
                <div className="p-5 sm:p-7">
                  <h3 className="text-base font-bold text-white sm:text-lg">
                    {dish.name}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400 sm:mt-4 sm:text-base sm:leading-7">
                    {dish.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between sm:mt-7">
                    <span className="text-sm text-zinc-400">Familiar</span>
                    <span className="text-lg font-bold text-[#e8b45f]">
                      {dish.price}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-black px-5 py-24 sm:px-6 sm:py-32">
        <img
          alt="Mesa servida para reservar en familia"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
          src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=85"
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 sm:gap-20 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-4xl leading-tight text-white sm:text-6xl">
              Descubre el verdadero sabor de casa.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-zinc-300 sm:mt-10 sm:text-lg sm:leading-9">
              Brasa encendida, acompanamientos colombianos y mesas listas para
              celebraciones, almuerzos familiares y pedidos para recoger.
            </p>
            <a
              className="mt-8 inline-flex rounded-sm bg-[#e8b45f] px-8 py-4 text-sm font-bold text-zinc-950 transition hover:bg-white sm:mt-10 sm:px-9 sm:py-5 sm:text-base"
              href="/#contacto"
              onClick={goToContact}
            >
              Reservar mesa
            </a>
          </div>
          <img
            alt="Fachada del asadero familiar"
            className="h-72 w-full rounded-sm object-cover grayscale sm:h-[520px]"
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=85"
          />
        </div>
      </section>

      <section className="flex min-h-[100svh] items-center bg-[#242424] px-5 py-24 text-center sm:px-6 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-4xl text-white sm:text-5xl">
            Galeria
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:mt-5 sm:text-base sm:leading-8">
            Imagenes elegidas desde el panel de empleados.
          </p>
          <div className="mt-10 grid gap-5 sm:mt-16 md:grid-cols-3 md:gap-7">
            {galleryDishes.map((dish, index) => (
              <figure
                className={`overflow-hidden rounded-sm bg-[#333333] ${
                  index === 0 || index === 2 ? "md:row-span-2" : ""
                }`}
                key={dish.id ?? dish.name}
              >
                <img
                  alt={dish.name}
                  className={`w-full object-cover ${
                    index === 0 || index === 2
                      ? "h-72 md:h-full md:min-h-[30rem]"
                      : "h-56 sm:h-64"
                  }`}
                  src={
                    dish.image ??
                    "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=900&q=85"
                  }
                />
                <figcaption className="p-4 text-left text-sm font-bold text-white sm:p-5 sm:text-base">
                  {dish.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <ContactSection />
      <ChatWidget />
    </>
  );
}
