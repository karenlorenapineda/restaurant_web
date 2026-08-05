import { ChatWidget } from "../components/ChatWidget";
import { ContactSection } from "../components/ContactSection";
import { featuredDishes } from "../data/menu";
import type { NavigationHandlers } from "../navigation";

export function HomePage({ navigate, goToContact }: NavigationHandlers) {
  return (
    <>
      <section className="relative flex min-h-screen items-center overflow-hidden px-5 pb-16 pt-28 text-white">
        <img
          alt="Mesa con comida colombiana tradicional"
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=85"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,0.92)_0%,rgba(24,24,27,0.72)_52%,rgba(127,29,29,0.28)_100%)]" />
        <div className="relative mx-auto w-full max-w-6xl">
          <p className="text-sm font-semibold uppercase text-red-800">
            Restaurante colombiano en Colombia
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold leading-none sm:text-7xl">
            Sabor colombiano, mesa generosa
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85">
            Platos tradicionales, ingredientes frescos y recetas con alma de
            casa: bandeja paisa, ajiaco, sancocho, empanadas y jugos naturales.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              className="rounded-md bg-red-950 px-5 py-3 font-bold text-white shadow-lg shadow-red-950/20 transition hover:bg-red-900"
              href="/menu"
              onClick={(event) => navigate("/menu", event)}
            >
              Ver menu completo
            </a>
            <a
              className="rounded-md border border-red-900 px-5 py-3 font-bold text-white transition hover:bg-red-950"
              href="/#contacto"
              onClick={goToContact}
            >
              Contactar
            </a>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center bg-[linear-gradient(180deg,#09090b_0%,#121113_100%)] px-5 py-24">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase text-red-800">
                Platos destacados
              </p>
              <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
                Lo mas pedido de la casa
              </h2>
              <p className="mt-4 leading-7 text-zinc-300">
                Una muestra de nuestros sabores principales. El resto de la
                carta esta en la pagina de menu.
              </p>
            </div>
            <a
              className="inline-flex rounded-md bg-red-950 px-5 py-3 font-bold text-white transition hover:bg-red-900"
              href="/menu"
              onClick={(event) => navigate("/menu", event)}
            >
              Ir al menu
            </a>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {featuredDishes.map((dish) => (
              <article
                className="overflow-hidden rounded-lg border border-red-950 bg-zinc-900 shadow-2xl shadow-black/40"
                key={dish.name}
              >
                <img
                  alt={dish.name}
                  className="h-56 w-full object-cover"
                  src={dish.image}
                />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display text-2xl font-bold">
                      {dish.name}
                    </h3>
                    <span className="whitespace-nowrap text-sm font-bold text-red-800">
                      {dish.price}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    {dish.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ContactSection />
      <ChatWidget />
    </>
  );
}
