import type { MenuSection } from "../data/menu";

export async function fetchMenu(signal?: AbortSignal) {
  const response = await fetch("/api/menu", {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error("Menu request failed");
  }

  return (await response.json()) as MenuSection[];
}
