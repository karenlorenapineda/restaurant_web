import type { MouseEvent } from "react";

export type Page = "employees" | "home" | "menu";

export interface NavigationHandlers {
  navigate: (path: string, event: MouseEvent<HTMLAnchorElement>) => void;
  goToContact: (event: MouseEvent<HTMLAnchorElement>) => void;
}

export function getPageFromPath(): Page {
  if (window.location.pathname === "/menu") {
    return "menu";
  }

  if (window.location.pathname === "/empleados") {
    return "employees";
  }

  return "home";
}
