import type { HealthStatus } from "../health";

interface FooterProps {
  status: HealthStatus;
  statusText: string;
}

export function Footer({ status, statusText }: FooterProps) {
  return (
    <footer className="border-t border-red-950/70 bg-zinc-950 px-5 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>Restaurante Picasso Colombia</p>
        <div aria-live="polite" className="flex items-center gap-3" role="status">
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full ${
              status === "online"
                ? "bg-red-800"
                : status === "offline"
                  ? "bg-red-950"
                  : "animate-pulse bg-red-700"
            }`}
          />
          <span>{statusText}</span>
        </div>
      </div>
    </footer>
  );
}
