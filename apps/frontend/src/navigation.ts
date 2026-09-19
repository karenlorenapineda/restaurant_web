import type { MouseEvent } from "react";

export type Page = "employees" | "home" | "menu" | "order";

export interface NavigationHandlers {
  navigate: (path: string, event: MouseEvent<HTMLAnchorElement>) => void;
  goToContact: (event: MouseEvent<HTMLAnchorElement>) => void;
}

export function getPageFromPath(): Page {
  if (
    window.location.pathname === "/pedido" ||
    window.location.pathname.startsWith("/pedido/") ||
    window.location.pathname === "/order" ||
    window.location.pathname.startsWith("/order/")
  ) {
    return "order";
  }

  if (window.location.pathname === "/menu") {
    return "menu";
  }

  if (window.location.pathname === "/empleados") {
    return "employees";
  }

  return "home";
}
