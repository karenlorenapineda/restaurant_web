import type { HealthStatus } from "../health";

interface FooterProps {
  status: HealthStatus;
  statusText: string;
}

export function Footer({ status, statusText }: FooterProps) {
  return (
    <footer className="bg-[#141414] px-5 py-16">
      <div className="mx-auto grid max-w-5xl gap-10 text-sm text-zinc-500 md:grid-cols-4">
        <div>
          <p className="font-display text-xl font-bold text-white">Picasso</p>
          <p className="mt-3 text-xs">Restaurante y asadero familiar</p>
        </div>
        <div className="grid gap-3">
          <a className="transition hover:text-[#e8b45f]" href="/">Home</a>
          <a className="transition hover:text-[#e8b45f]" href="/menu">Menu</a>
          <a className="transition hover:text-[#e8b45f]" href="/#contacto">
            Reservas
          </a>
        </div>
        <div className="grid gap-3">
          <span>Facebook</span>
          <span>Instagram</span>
          <span>WhatsApp</span>
        </div>
        <div aria-live="polite" className="flex items-center gap-3" role="status">
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
    </footer>
  );
}
