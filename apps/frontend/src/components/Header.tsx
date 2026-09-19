import { T, t } from "../i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useState } from "react";

import type { NavigationHandlers } from "../navigation";

export function Header({ navigate, goToContact }: NavigationHandlers) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-20 bg-black/20 text-white backdrop-blur-sm">
      <nav
        aria-label={t("Navegacion principal")}
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
              <T>Restaurante y asadero</T>
            </span>
          </span>
        </a>

        <button
          aria-expanded={isMenuOpen}
          aria-label={t("Abrir menu de navegacion")}
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

        <div className="hidden items-center gap-3 text-sm font-semibold tracking-[0.14em] text-zinc-200 md:flex lg:gap-7">
          <a
            className="transition hover:text-[#e8b45f]"
            href="/"
            onClick={(event) => navigate("/", event)}
          >
            <T>HOME</T>
          </a>
          <a
            className="transition hover:text-[#e8b45f]"
            href="/menu"
            onClick={(event) => navigate("/menu", event)}
          >
            <T>MENU</T>
          </a>
          <a
            className="transition hover:text-[#e8b45f]"
            href="/pedido"
            onClick={(event) => navigate("/pedido", event)}
          >
            <T>PEDIR ONLINE</T>
          </a>
          <a
            className="transition hover:text-[#e8b45f]"
            href="/#contacto"
            onClick={goToContact}
          >
            <T>CONTACTO</T>
          </a>
          <a
            className="transition hover:text-[#e8b45f]"
            href="/empleados"
            onClick={(event) => navigate("/empleados", event)}
          >
            <T>EMPLEADOS</T>
          </a>
          <LanguageSwitcher />
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
              <T>Home</T>
            </a>
            <a
              className="py-2 transition hover:text-[#e8b45f]"
              href="/menu"
              onClick={(event) => {
                setIsMenuOpen(false);
                navigate("/menu", event);
              }}
            >
              <T>Menu</T>
            </a>
            <a
              className="py-2 transition hover:text-[#e8b45f]"
              href="/pedido"
              onClick={(event) => {
                setIsMenuOpen(false);
                navigate("/pedido", event);
              }}
            >
              <T>Pedir online</T>
            </a>
            <a
              className="py-2 transition hover:text-[#e8b45f]"
              href="/#contacto"
              onClick={(event) => {
                setIsMenuOpen(false);
                goToContact(event);
              }}
            >
              <T>Contacto</T>
            </a>
            <a
              className="py-2 transition hover:text-[#e8b45f]"
              href="/empleados"
              onClick={(event) => {
                setIsMenuOpen(false);
                navigate("/empleados", event);
              }}
            >
              <T>Empleados</T>
            </a>
            <div className="border-t border-white/10 pt-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
