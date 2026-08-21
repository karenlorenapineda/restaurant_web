import { useState } from "react";

import type { NavigationHandlers } from "../navigation";

export function Header({ navigate, goToContact }: NavigationHandlers) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-20 bg-black/20 text-white backdrop-blur-sm">
      <nav
        aria-label="Navegacion principal"
        className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 sm:py-5"
      >
        <a
          className="flex items-center gap-3 sm:gap-4"
          href="/"
          onClick={(event) => {
            setIsMenuOpen(false);
            navigate("/", event);
          }}
        >
          <span className="grid h-10 w-14 place-items-center rounded-sm border border-white/30 bg-black/20 text-[10px] font-bold uppercase tracking-[0.08em] text-white sm:h-12 sm:w-16 sm:text-[11px] sm:tracking-[0.18em]">
            Logo
          </span>
          <span>
            <span className="block font-display text-xl font-bold leading-none tracking-[0.035em] sm:text-2xl sm:tracking-[0.08em]">
              Picasso
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-300 sm:text-xs sm:tracking-[0.16em]">
              Restaurante y asadero
            </span>
          </span>
        </a>

        <button
          aria-expanded={isMenuOpen}
          aria-label="Abrir menu de navegacion"
          className="grid h-11 w-11 place-items-center rounded-sm border border-white/30 bg-black/20 md:hidden"
          onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
          type="button"
        >
          <span className="grid gap-1.5">
            <span className="block h-0.5 w-6 bg-white" />
            <span className="block h-0.5 w-6 bg-white" />
            <span className="block h-0.5 w-6 bg-white" />
          </span>
        </button>

        <div className="hidden gap-5 text-sm font-semibold tracking-[0.14em] text-zinc-200 sm:gap-10 md:flex">
          <a
            className="transition hover:text-[#e8b45f]"
            href="/"
            onClick={(event) => navigate("/", event)}
          >
            HOME
          </a>
          <a
            className="transition hover:text-[#e8b45f]"
            href="/menu"
            onClick={(event) => navigate("/menu", event)}
          >
            MENU
          </a>
          <a
            className="transition hover:text-[#e8b45f]"
            href="/#contacto"
            onClick={goToContact}
          >
            CONTACTO
          </a>
          <a
            className="transition hover:text-[#e8b45f]"
            href="/empleados"
            onClick={(event) => navigate("/empleados", event)}
          >
            EMPLEADOS
          </a>
        </div>
      </nav>

      {isMenuOpen ? (
        <div className="border-t border-white/10 bg-black/88 px-5 py-5 shadow-2xl shadow-black/50 md:hidden">
          <div className="mx-auto grid max-w-7xl gap-4 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-200">
            <a
              className="py-2 transition hover:text-[#e8b45f]"
              href="/"
              onClick={(event) => {
                setIsMenuOpen(false);
                navigate("/", event);
              }}
            >
              Home
            </a>
            <a
              className="py-2 transition hover:text-[#e8b45f]"
              href="/menu"
              onClick={(event) => {
                setIsMenuOpen(false);
                navigate("/menu", event);
              }}
            >
              Menu
            </a>
            <a
              className="py-2 transition hover:text-[#e8b45f]"
              href="/#contacto"
              onClick={(event) => {
                setIsMenuOpen(false);
                goToContact(event);
              }}
            >
              Contacto
            </a>
            <a
              className="py-2 transition hover:text-[#e8b45f]"
              href="/empleados"
              onClick={(event) => {
                setIsMenuOpen(false);
                navigate("/empleados", event);
              }}
            >
              Empleados
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
