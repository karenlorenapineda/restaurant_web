import { legalCopy } from "../legal/legalCopy";
import type { NavigationHandlers } from "../navigation";
import { T, useLocale } from "../i18n";
import type { HealthStatus } from "../health";

interface FooterProps {
  navigate?: NavigationHandlers["navigate"];
  status: HealthStatus;
  statusText: string;
}

export function Footer({ status, statusText, navigate }: FooterProps) {
  const labels = legalCopy[useLocale()];
  return (
    <footer className="bg-[#141414] px-5 py-16">
      <div className="mx-auto grid max-w-5xl gap-10 text-sm text-zinc-500 md:grid-cols-4">
        <div>
          <p className="font-display text-xl font-bold text-white">Picasso</p>
          <p className="mt-3 text-xs">
            <T>Restaurante y asadero familiar</T>
          </p>
        </div>
        <div className="grid gap-3">
          <a className="transition hover:text-[#e8b45f]" href="/">
            <T>Home</T>
          </a>
          <a className="transition hover:text-[#e8b45f]" href="/menu">
            <T>Menu</T>
          </a>
          <a className="transition hover:text-[#e8b45f]" href="/pedido">
            <T>Pedir online</T>
          </a>
          <a className="transition hover:text-[#e8b45f]" href="/#contacto">
            <T>Reservas</T>
          </a>
        </div>
        <div className="grid gap-3">
          <span>Facebook</span>
          <span>Instagram</span>
          <span>WhatsApp</span>
        </div>
        <div
          aria-live="polite"
          className="flex items-center gap-3"
          role="status"
        >
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full ${
              status === "online"
                ? "bg-[#e8b45f]"
                : status === "offline"
                  ? "bg-red-900"
                  : "animate-pulse bg-[#e8b45f]"
            }`}
          />
          <span>{statusText}</span>
        </div>
      </div>
      <nav
        aria-label={labels.privacy + " / " + labels.terms}
        className="mx-auto mt-10 flex max-w-5xl flex-wrap gap-x-6 gap-y-3 border-t border-white/15 pt-6 text-sm text-zinc-300"
      >
        {(
          [
            ["/privacidad", labels.privacy],
            ["/terminos", labels.terms],
          ] as const
        ).map(([path, label]) => (
          <a
            key={path}
            href={path}
            className="underline underline-offset-4 transition hover:text-[#e8b45f]"
            onClick={(event) => {
              if (
                navigate &&
                event.button === 0 &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.shiftKey &&
                !event.altKey
              )
                navigate(path, event);
            }}
          >
            {label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
