import type { NavigationHandlers } from "../navigation";

export function Header({ navigate, goToContact }: NavigationHandlers) {
  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-red-950/80 bg-zinc-950/92 text-white shadow-lg shadow-black/20 backdrop-blur">
      <nav
        aria-label="Navegacion principal"
        className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"
      >
        <a
          className="font-display text-2xl font-bold"
          href="/"
          onClick={(event) => navigate("/", event)}
        >
          Picasso
        </a>
        <div className="flex gap-4 text-sm font-semibold text-zinc-200 sm:gap-8">
          <a
            className="transition hover:text-red-700"
            href="/"
            onClick={(event) => navigate("/", event)}
          >
            Home
          </a>
          <a
            className="transition hover:text-red-700"
            href="/menu"
            onClick={(event) => navigate("/menu", event)}
          >
            Menu
          </a>
          <a
            className="transition hover:text-red-700"
            href="/#contacto"
            onClick={goToContact}
          >
            Contacto
          </a>
          <a
            className="transition hover:text-red-700"
            href="/empleados"
            onClick={(event) => navigate("/empleados", event)}
          >
            Empleados
          </a>
        </div>
      </nav>
    </header>
  );
}
