import { useEffect, useState } from "react";
import type { MouseEvent } from "react";

import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import type { HealthResponse, HealthStatus } from "./health";
import { getPageFromPath } from "./navigation";
import type { Page } from "./navigation";
import { EmployeePanelPage } from "./pages/EmployeePanelPage";
import { HomePage } from "./pages/HomePage";
import { MenuPage } from "./pages/MenuPage";

export function App() {
  const [status, setStatus] = useState<HealthStatus>("checking");
  const [page, setPage] = useState<Page>(getPageFromPath);

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

  useEffect(() => {
    function syncPage() {
      setPage(getPageFromPath());
    }

    window.addEventListener("popstate", syncPage);
    return () => window.removeEventListener("popstate", syncPage);
  }, []);

  function navigate(path: string, event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    window.history.pushState({}, "", path);
    setPage(getPageFromPath());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToContact(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    if (window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
      setPage("home");
    }

    window.setTimeout(() => {
      document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }

  const statusText = {
    checking: "Comprobando servicios",
    online: "Application and database are online",
    offline: "Servicios no disponibles",
  }[status];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-red-950 selection:text-white">
      <Header navigate={navigate} goToContact={goToContact} />
      {page === "employees" ? (
        <EmployeePanelPage navigate={navigate} />
      ) : page === "menu" ? (
        <MenuPage navigate={navigate} />
      ) : (
        <HomePage navigate={navigate} goToContact={goToContact} />
      )}
      <Footer status={status} statusText={statusText} />
    </main>
  );
}
