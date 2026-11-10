import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { setLocale } from "../i18n";
beforeEach(() => {
  vi.stubGlobal("scrollTo", vi.fn());
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));
});
afterEach(() => {
  setLocale("es");
  window.history.replaceState({}, "", "/");
  vi.unstubAllGlobals();
});
describe.each([
  [
    "es",
    "Política de privacidad",
    "Términos de uso",
    "Volver al inicio",
    "Quién gestiona la información",
  ],
  [
    "en",
    "Privacy policy",
    "Terms of use",
    "Back to home",
    "Who manages the information",
  ],
  [
    "pt",
    "Política de privacidade",
    "Termos de utilização",
    "Voltar ao início",
    "Quem gere a informação",
  ],
] as const)("legal content in %s", (locale, privacy, terms, back, section) => {
  it.each([
    ["/privacidad", "privacy"],
    ["/terminos", "terms"],
  ])("opens %s without a working backend", async (path, kind) => {
    setLocale(locale);
    window.history.replaceState({}, "", path);
    render(<App />);
    const heading = await screen.findByRole("heading", {
      level: 1,
      name: kind === "privacy" ? privacy : terms,
    });
    expect(heading).toHaveFocus();
    expect(document.title).toBe(
      `${kind === "privacy" ? privacy : terms} · Picasso`,
    );
    const article = screen.getByRole("article");
    expect(within(article).getAllByRole("heading", { level: 2 })).toHaveLength(
      7,
    );
    expect(screen.getByRole("link", { name: back })).toHaveAttribute(
      "href",
      "/",
    );
    expect(document.querySelector("time")).toHaveAttribute(
      "datetime",
      "2026-11-05",
    );
    if (kind === "privacy")
      expect(
        screen.getByRole("heading", { name: section }),
      ).toBeInTheDocument();
  });
});
it("opens both documents from the footer, follows the cross-link and handles history navigation", async () => {
  setLocale("es");
  window.history.replaceState({}, "", "/");
  render(<App />);
  fireEvent.click(screen.getByRole("link", { name: "Política de privacidad" }));
  expect(window.location.pathname).toBe("/privacidad");
  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "Política de privacidad",
    }),
  ).toBeInTheDocument();
  const page = screen.getByRole("region", { name: "Política de privacidad" });
  fireEvent.click(within(page).getByRole("link", { name: "Términos de uso" }));
  expect(window.location.pathname).toBe("/terminos");
  expect(
    screen.getByRole("heading", { level: 1, name: "Términos de uso" }),
  ).toBeInTheDocument();
  act(() => {
    window.history.replaceState({}, "", "/privacidad");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  expect(
    screen.getByRole("heading", { level: 1, name: "Política de privacidad" }),
  ).toBeInTheDocument();
});
it("switches the entire legal page and footer labels without changing the route", async () => {
  setLocale("es");
  window.history.replaceState({}, "", "/privacidad");
  render(<App />);
  await screen.findByRole("heading", {
    name: "Política de privacidad",
    level: 1,
  });
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(
    screen.getByRole("heading", { name: "Privacy policy", level: 1 }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", {
      name: "Browser storage and external resources",
    }),
  ).toBeInTheDocument();
  expect(screen.getByRole("contentinfo")).toHaveTextContent("Terms of use");
  fireEvent.click(screen.getByRole("button", { name: "Português" }));
  expect(
    screen.getByRole("heading", { name: "Política de privacidade", level: 1 }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", {
      name: "Armazenamento no navegador e recursos externos",
    }),
  ).toBeInTheDocument();
  expect(window.location.pathname).toBe("/privacidad");
});
it.each([
  ["/privacy/", "Política de privacidad"],
  ["/terms/", "Términos de uso"],
  ["/privacidad/", "Política de privacidad"],
  ["/terminos/", "Términos de uso"],
])("supports direct links to %s", async (path, title) => {
  setLocale("es");
  window.history.replaceState({}, "", path);
  render(<App />);
  expect(
    await screen.findByRole("heading", { name: title, level: 1 }),
  ).toBeInTheDocument();
});
