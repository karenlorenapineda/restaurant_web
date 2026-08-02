import { useEffect, useState } from "react";

type HealthStatus = "checking" | "online" | "offline";

interface HealthResponse {
  status: "ok";
  services: {
    database: "up";
  };
  timestamp: string;
}

export function App() {
  const [status, setStatus] = useState<HealthStatus>("checking");

  useEffect(() => {
    const controller = new AbortController();

    async function checkHealth() {
      try {
        const response = await fetch("/api/health", {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Health check failed");
        }

        const health = (await response.json()) as HealthResponse;
        setStatus(
          health.status === "ok" && health.services.database === "up"
            ? "online"
            : "offline",
        );
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setStatus("offline");
        }
      }
    }

    void checkHealth();
    return () => controller.abort();
  }, []);

  const statusText = {
    checking: "Checking services",
    online: "Application and database are online",
    offline: "Services are currently unavailable",
  }[status];

  return (
    <main className="min-h-screen bg-picasso-cream px-6 py-12 text-picasso-ink">
      <section className="mx-auto flex min-h-[70vh] max-w-5xl items-center">
        <div className="w-full rounded-3xl border border-black/10 bg-white/70 p-8 shadow-xl shadow-black/5 backdrop-blur sm:p-12">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-picasso-terracotta">
            Restaurant platform
          </p>
          <h1 className="font-display text-5xl font-bold sm:text-7xl">
            Picasso
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-black/65">
            The shared foundation for ordering, kitchen operations and
            restaurant management.
          </p>

          <div
            aria-live="polite"
            className="mt-10 flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-4"
            role="status"
          >
            <span
              aria-hidden="true"
              className={`h-3 w-3 rounded-full ${
                status === "online"
                  ? "bg-picasso-olive"
                  : status === "offline"
                    ? "bg-picasso-terracotta"
                    : "animate-pulse bg-picasso-gold"
              }`}
            />
            <span className="font-medium">{statusText}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
