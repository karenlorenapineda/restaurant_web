import { T, t } from "../i18n";
import { useEffect, useState } from "react";

import { ChatWidget } from "../components/ChatWidget";
import { ContactSection } from "../components/ContactSection";
import { menuSections } from "../data/menu";
import type { MenuSection } from "../data/menu";
import {
  getFeaturedDishes,
  getGalleryDishes,
  loadStoredMenu,
} from "../menuStore";
import type { NavigationHandlers } from "../navigation";

export function HomePage({ navigate, goToContact }: NavigationHandlers) {
  const [sections, setSections] = useState<MenuSection[]>(
    loadStoredMenu() ?? menuSections,
  );
  const featuredDishes = getFeaturedDishes(sections);
  const galleryDishes = getGalleryDishes(sections);

  useEffect(() => {
    function syncMenu() {
      setSections(loadStoredMenu() ?? menuSections);
    }

    window.addEventListener("picasso-menu-updated", syncMenu);

    return () => {
      window.removeEventListener("picasso-menu-updated", syncMenu);
    };
  }, []);

  return (
    <>
      <section className="relative grid min-h-[100svh] place-items-center overflow-hidden px-5 py-28 text-center text-white sm:px-6 sm:py-36">
        <img
          alt="Mesa familiar de restaurante con ambiente calido"
          className="absolute inset-0 h-full w-full object-cover brightness-[0.55]"
          src="/images/restaurante_vacio.png"
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]" />
        <div className="relative mx-auto max-w-5xl">
          <div className="mx-auto mb-10 grid h-24 w-36 place-items-center rounded-sm border border-[#e8b45f]/50 bg-black/35 text-xs font-bold uppercase tracking-wide text-[#e8b45f] sm:mb-16 sm:h-28 sm:w-40 sm:text-sm">
            <T>Espacio logo</T>
          </div>
          <p className="text-sm font-bold uppercase tracking-wide text-[#e8b45f] sm:text-base">
            <T>Restaurante y asadero familiar</T>
          </p>
          <h1 className="mt-5 font-display text-5xl font-bold leading-tight sm:mt-7 sm:text-8xl">
            <T>Buena comida, grandes momentos</T>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-zinc-200 sm:mt-8 sm:text-lg sm:leading-9">
            <T>
              Platos colombianos, carnes al asador y recetas de casa para
              sentarse en familia y compartir sin prisa.
            </T>
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3 sm:mt-12">
            <a
              className="inline-flex rounded-sm bg-[#e8b45f] px-8 py-4 text-sm font-bold text-zinc-950 transition hover:bg-white sm:px-10 sm:py-5 sm:text-base"
              href="/#contacto"
              onClick={goToContact}
            >
              <T>Reservar mesa</T>
            </a>
            <a
              className="inline-flex rounded-sm border border-white/70 px-8 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-zinc-950 sm:px-10 sm:py-5 sm:text-base"
              href="/pedido"
              onClick={(event) => navigate("/pedido", event)}
            >
              <T>Pedir online</T>
            </a>
          </div>
        </div>
      </section>

      <section className="flex min-h-[100svh] items-center bg-[#242424] px-5 py-24 text-center sm:px-6 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-4xl text-[#e8b45f] sm:text-5xl">
            <T>Especiales de hoy</T>
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:mt-5 sm:text-base sm:leading-8">
            <T>Favoritos editables desde el panel de empleados.</T>
          </p>

          <div className="mt-10 grid gap-6 sm:mt-16 md:grid-cols-3 md:gap-10">
            {featuredDishes.map((dish) => (
              <article
                className="overflow-hidden rounded-sm bg-[#333333] text-left shadow-xl shadow-black/25"
                key={dish.id ?? dish.name}
              >
                <img
                  alt={t(dish.name)}
                  className="h-56 w-full object-cover sm:h-72"
                  src={
                    dish.image ?? "/images/Plato01.png"
                  }
                />
                <div className="p-5 sm:p-7">
                  <h3 className="text-base font-bold text-white sm:text-lg">
                    {t(dish.name)}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400 sm:mt-4 sm:text-base sm:leading-7">
                    {t(dish.description)}
                  </p>
                  <div className="mt-5 flex items-center justify-between sm:mt-7">
                    <span className="text-sm text-zinc-400">
                      <T>Familiar</T>
                    </span>
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
          src="/images/Cocina.png"
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 sm:gap-20 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-4xl leading-tight text-white sm:text-6xl">
              <T>Descubre el verdadero sabor de casa.</T>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-zinc-300 sm:mt-10 sm:text-lg sm:leading-9">
              <T>
                Brasa encendida, acompanamientos colombianos y mesas listas para
                celebraciones, almuerzos familiares y pedidos para recoger.
              </T>
            </p>
            <a
              className="mt-8 inline-flex rounded-sm bg-[#e8b45f] px-8 py-4 text-sm font-bold text-zinc-950 transition hover:bg-white sm:mt-10 sm:px-9 sm:py-5 sm:text-base"
              href="/#contacto"
              onClick={goToContact}
            >
              <T>Reservar mesa</T>
            </a>
          </div>
          <img
            alt="Fachada del asadero familiar"
            className="h-72 w-full rounded-sm object-cover grayscale sm:h-[520px]"
            src="/images/restaurante_entrada.png"
          />
        </div>
      </section>

      <section className="flex min-h-[100svh] items-center bg-[#242424] px-5 py-24 text-center sm:px-6 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-4xl text-white sm:text-5xl">
            <T>Galeria</T>
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:mt-5 sm:text-base sm:leading-8">
            <T>Imagenes elegidas desde el panel de empleados.</T>
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
                  alt={t(dish.name)}
                  className={`w-full object-cover ${
                    index === 0 || index === 2
                      ? "h-72 md:h-full md:min-h-[30rem]"
                      : "h-56 sm:h-64"
                  }`}
                  src={
                    dish.image ?? "/images/Plato01.png"
                  }
                />
                <figcaption className="p-4 text-left text-sm font-bold text-white sm:p-5 sm:text-base">
                  {t(dish.name)}
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
