import type { MouseEvent } from "react";

export type Page =
  | "employees"
  | "home"
  | "menu"
  | "order"
  | "design-system"
  | "privacy"
  | "terms";

export interface NavigationHandlers {
  navigate: (path: string, event: MouseEvent<HTMLAnchorElement>) => void;
  goToContact: (event: MouseEvent<HTMLAnchorElement>) => void;
}

export function getPageFromPath(): Page {
  const path = window.location.pathname.replace(/\/+$/, "");
  if (path === "/privacidad" || path === "/privacy") return "privacy";
  if (path === "/terminos" || path === "/terms") return "terms";
  if (window.location.pathname === "/design-system") return "design-system";
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
