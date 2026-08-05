import { FormEvent, useEffect, useMemo, useState } from "react";

import { fetchMenu } from "../api/menu";
import type { EditableDish } from "../menuStore";
import {
  addDishToSections,
  flattenMenu,
  getEditableDishKey,
  getMenuForEditing,
  loadStoredMenu,
  saveStoredMenu,
  updateDishInSections,
} from "../menuStore";
import type { NavigationHandlers } from "../navigation";

const EMPLOYEE_SESSION_KEY = "picasso.employeeSession";
const EMPLOYEE_EMAIL = "empleado@picasso.co";
const EMPLOYEE_PASSWORD = "Picasso2026";

function createEmptyDish(categoryTitle: string): EditableDish {
  return {
    available: true,
    categoryTitle,
    description: "",
    id: Date.now(),
    image: "/images/nuevo-plato.jpg",
    name: "Nuevo plato",
    price: "$0 COP",
  };
}

export function EmployeePanelPage({
  navigate,
}: Pick<NavigationHandlers, "navigate">) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    window.localStorage.getItem(EMPLOYEE_SESSION_KEY) === "active",
  );
  const [loginError, setLoginError] = useState("");
  const [sections, setSections] = useState(getMenuForEditing);
  const dishes = useMemo(() => flattenMenu(sections), [sections]);
  const [selectedDishKey, setSelectedDishKey] = useState(
    dishes[0] ? getEditableDishKey(dishes[0]) : "",
  );
  const selectedDish =
    dishes.find((dish) => getEditableDishKey(dish) === selectedDishKey) ??
    dishes[0];
  const [draft, setDraft] = useState<EditableDish | null>(selectedDish ?? null);
  const [isCreatingDish, setIsCreatingDish] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadMenu() {
      if (loadStoredMenu()) {
        return;
      }

      try {
        const apiSections = await fetchMenu(controller.signal);

        if (!controller.signal.aborted && apiSections.length > 0) {
          setSections(apiSections);
          const firstDish = flattenMenu(apiSections)[0];
          if (firstDish) {
            setSelectedDishKey(getEditableDishKey(firstDish));
            setDraft(firstDish);
          }
        }
      } catch {
        // The panel keeps the local example menu when the backend is unavailable.
      }
    }

    void loadMenu();
    return () => controller.abort();
  }, []);

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    if (email === EMPLOYEE_EMAIL && password === EMPLOYEE_PASSWORD) {
      window.localStorage.setItem(EMPLOYEE_SESSION_KEY, "active");
      setIsAuthenticated(true);
      setLoginError("");
      return;
    }

    setLoginError("Credenciales incorrectas.");
  }

  function logout() {
    window.localStorage.removeItem(EMPLOYEE_SESSION_KEY);
    setIsAuthenticated(false);
  }

  function selectDish(dish: EditableDish) {
    setSelectedDishKey(getEditableDishKey(dish));
    setDraft(dish);
    setIsCreatingDish(false);
    setSaveMessage("");
  }

  function startNewDish() {
    const newDish = createEmptyDish(sections[0]?.title ?? "Platos fuertes");
    setDraft(newDish);
    setSelectedDishKey(getEditableDishKey(newDish));
    setIsCreatingDish(true);
    setSaveMessage("");
  }

  function updateDraft(field: keyof EditableDish, value: string | boolean) {
    if (!draft) {
      return;
    }

    setDraft({ ...draft, [field]: value });
  }

  function saveDish() {
    if (!draft) {
      return;
    }

    const nextSections = isCreatingDish
      ? addDishToSections(sections, draft)
      : updateDishInSections(sections, selectedDishKey, draft);

    setSections(nextSections);
    setSelectedDishKey(getEditableDishKey(draft));
    setIsCreatingDish(false);
    saveStoredMenu(nextSections);
    setSaveMessage("Cambios guardados en este navegador.");
  }

  if (!isAuthenticated) {
    return (
      <section className="flex min-h-screen items-center bg-[linear-gradient(135deg,#09090b_0%,#181113_52%,#09090b_100%)] px-5 py-24">
        <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-red-800">
              Acceso empleados
            </p>
            <h1 className="mt-3 font-display text-5xl font-bold sm:text-6xl">
              Panel privado del restaurante
            </h1>
            <p className="mt-5 leading-8 text-zinc-300">
              Entra con credenciales para gestionar platos, disponibilidad,
              precios e imagenes del menu.
            </p>
            <p className="mt-6 rounded-lg border border-red-950 bg-zinc-950 p-4 text-sm text-zinc-400">
              Demo: empleado@picasso.co / Picasso2026
            </p>
          </div>

          <form
            className="rounded-lg border border-red-950 bg-zinc-950 p-6 shadow-2xl shadow-black/40"
            onSubmit={submitLogin}
          >
            <label className="block text-sm font-semibold text-zinc-200">
              Email
              <input
                className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-red-900"
                name="email"
                placeholder="empleado@picasso.co"
                type="email"
              />
            </label>
            <label className="mt-5 block text-sm font-semibold text-zinc-200">
              Contrasena
              <input
                className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-red-900"
                name="password"
                placeholder="Picasso2026"
                type="password"
              />
            </label>
            {loginError ? (
              <p className="mt-4 text-sm font-semibold text-red-700">
                {loginError}
              </p>
            ) : null}
            <button
              className="mt-6 w-full rounded-md bg-red-950 px-5 py-3 font-bold text-white transition hover:bg-red-900"
              type="submit"
            >
              Entrar
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#09090b_0%,#111113_50%,#09090b_100%)] px-5 pb-20 pt-32">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-red-800">
              Panel de empleados
            </p>
            <h1 className="mt-3 font-display text-5xl font-bold sm:text-6xl">
              Gestion del menu
            </h1>
            <p className="mt-5 max-w-2xl leading-8 text-zinc-300">
              Edita platos existentes o crea nuevos platos para la carta.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-md border border-red-950 px-5 py-3 font-bold text-white transition hover:bg-red-950"
              onClick={logout}
              type="button"
            >
              Salir
            </button>
            <a
              className="inline-flex rounded-md bg-red-950 px-5 py-3 font-bold text-white transition hover:bg-red-900"
              href="/menu"
              onClick={(event) => navigate("/menu", event)}
            >
              Ver menu
            </a>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Metric label="Platos" value={String(dishes.length)} />
          <Metric
            label="Disponibles"
            value={String(dishes.filter((dish) => dish.available).length)}
          />
          <Metric label="Categorias" value={String(sections.length)} />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-red-950 bg-zinc-900 p-5 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-bold">Platos</h2>
              <button
                className="rounded-md bg-red-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-900"
                onClick={startNewDish}
                type="button"
              >
                Anadir plato
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              {dishes.map((dish) => (
                <button
                  className={`rounded-md border p-4 text-left transition ${
                    getEditableDishKey(dish) === selectedDishKey &&
                    !isCreatingDish
                      ? "border-red-900 bg-zinc-800"
                      : "border-zinc-800 bg-zinc-950 hover:border-red-950"
                  }`}
                  key={`${dish.categoryTitle}-${getEditableDishKey(dish)}`}
                  onClick={() => selectDish(dish)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-zinc-100">{dish.name}</p>
                      <p className="mt-1 text-xs font-semibold uppercase text-red-800">
                        {dish.categoryTitle}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-red-800">
                      {dish.price}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-red-950 bg-zinc-900 p-6 shadow-2xl shadow-black/40">
            <h2 className="font-display text-2xl font-bold">
              {isCreatingDish ? "Nuevo plato" : "Editar plato"}
            </h2>
            {draft ? (
              <form className="mt-6 grid gap-5">
                <label className="block text-sm font-semibold text-zinc-200">
                  Nombre
                  <input
                    className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-red-900"
                    onChange={(event) => updateDraft("name", event.target.value)}
                    type="text"
                    value={draft.name}
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-zinc-200">
                    Categoria
                    <select
                      className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-red-900"
                      onChange={(event) =>
                        updateDraft("categoryTitle", event.target.value)
                      }
                      value={draft.categoryTitle}
                    >
                      {sections.map((section) => (
                        <option key={section.title}>{section.title}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-zinc-200">
                    Precio
                    <input
                      className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-red-900"
                      onChange={(event) =>
                        updateDraft("price", event.target.value)
                      }
                      type="text"
                      value={draft.price}
                    />
                  </label>
                </div>

                <label className="block text-sm font-semibold text-zinc-200">
                  Imagen
                  <input
                    className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-red-900"
                    onChange={(event) => updateDraft("image", event.target.value)}
                    placeholder="/images/bandeja-paisa.jpg"
                    type="text"
                    value={draft.image ?? ""}
                  />
                </label>

                <label className="block text-sm font-semibold text-zinc-200">
                  Descripcion
                  <textarea
                    className="mt-2 min-h-32 w-full rounded-md border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-red-900"
                    onChange={(event) =>
                      updateDraft("description", event.target.value)
                    }
                    value={draft.description}
                  />
                </label>

                <label className="flex items-center gap-3 text-sm font-semibold text-zinc-200">
                  <input
                    checked={draft.available}
                    className="h-5 w-5 accent-red-950"
                    onChange={(event) =>
                      updateDraft("available", event.target.checked)
                    }
                    type="checkbox"
                  />
                  Disponible en el menu
                </label>

                {saveMessage ? (
                  <p className="text-sm font-semibold text-red-800">
                    {saveMessage}
                  </p>
                ) : null}

                <button
                  className="rounded-md bg-red-950 px-5 py-3 font-bold text-white transition hover:bg-red-900"
                  onClick={saveDish}
                  type="button"
                >
                  Guardar cambios
                </button>
              </form>
            ) : (
              <p className="mt-6 text-zinc-400">No hay platos para editar.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-red-950 bg-zinc-900 p-5 shadow-2xl shadow-black/40">
      <p className="text-xs font-bold uppercase text-red-800">{label}</p>
      <p className="mt-3 font-display text-4xl font-bold">{value}</p>
    </div>
  );
}
