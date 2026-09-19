import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { t, useLocale } from "../i18n";
import { OrderPaymentStep } from "../components/OrderPaymentStep";
import { ORDER_COPY } from "../orderCopy";
import { menuSections } from "../data/menu";
import type { MenuSection } from "../data/menu";
import { flattenMenu, getEditableDishKey, loadStoredMenu } from "../menuStore";
import type { NavigationHandlers } from "../navigation";
import { addOnlineOrder } from "../onlineOrderStore";
import type { OnlineOrder } from "../onlineOrderStore";

type OrderStep = "dishes" | "details" | "payment";
const ORDER_STEPS: OrderStep[] = ["dishes", "details", "payment"];
const FULFILLMENT_OPTIONS = ["pickup", "delivery"] as const;
const DETAIL_FIELDS = [
  { key: "name", maxLength: 80, minLength: 2 },
  { key: "phone", maxLength: 25, minLength: 7 },
  { key: "address", maxLength: 180, minLength: 5 },
] as const;

interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  notes: string;
}

const EMPTY_CONTACT: CustomerDetails = {
  name: "",
  phone: "",
  address: "",
  notes: "",
};
const CURRENCY_FORMATTERS = {
  es: new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }),
  en: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }),
};

function stepFromPath(): OrderStep {
  if (/\/(datos|details)$/.test(window.location.pathname)) return "details";
  if (/\/(pago|payment)$/.test(window.location.pathname)) return "payment";
  return "dishes";
}

function orderBasePath() {
  return window.location.pathname.startsWith("/order") ? "/order" : "/pedido";
}

function parsePrice(price: string): number | null {
  const match = price.trim().match(/^\$?\s*(\d+(?:[.,]\d{3})*)\s*(?:COP)?$/i);
  if (!match?.[1]) return null;
  const amount = Number(match[1].replace(/[.,]/g, ""));
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

export function OrderPage({ navigate }: Pick<NavigationHandlers, "navigate">) {
  const locale = useLocale();
  const copy = ORDER_COPY[locale];
  const [sections, setSections] = useState<MenuSection[]>(
    loadStoredMenu() ?? menuSections,
  );
  const [cart, setCart] = useState<Record<string, number>>({});
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">(
    "pickup",
  );
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<OnlineOrder | null>(null);
  const [step, setStep] = useState<OrderStep>(stepFromPath);
  const [contact, setContact] = useState<CustomerDetails>(EMPTY_CONTACT);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pse">("card");

  useEffect(() => {
    const syncMenu = () => setSections(loadStoredMenu() ?? menuSections);
    window.addEventListener("picasso-menu-updated", syncMenu);
    return () => window.removeEventListener("picasso-menu-updated", syncMenu);
  }, []);

  useEffect(() => {
    const syncStep = () => setStep(stepFromPath());
    window.addEventListener("popstate", syncStep);
    window.addEventListener("picasso-navigation", syncStep);
    return () => {
      window.removeEventListener("popstate", syncStep);
      window.removeEventListener("picasso-navigation", syncStep);
    };
  }, []);

  const dishes = useMemo(
    () => flattenMenu(sections).filter((dish) => dish.available),
    [sections],
  );
  const categories = ["Todos", ...sections.map((section) => section.title)];
  const visibleDishes = dishes.filter((dish) => {
    const matchesCategory =
      category === "Todos" || dish.categoryTitle === category;
    const searchText =
      `${t(dish.name)} ${t(dish.description)} ${t(dish.categoryTitle)}`.toLocaleLowerCase();
    return (
      matchesCategory && searchText.includes(query.trim().toLocaleLowerCase())
    );
  });
  const cartLines = dishes.flatMap((dish) => {
    const quantity = cart[getEditableDishKey(dish)] ?? 0;
    const unitPrice = parsePrice(dish.price);
    return quantity > 0 && unitPrice !== null
      ? [{ dish, quantity, unitPrice }]
      : [];
  });
  const total = cartLines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  );
  const currency = (amount: number) =>
    CURRENCY_FORMATTERS[locale].format(amount);

  useEffect(() => {
    if (!confirmation && step !== "dishes" && cartLines.length === 0) {
      window.history.replaceState({}, "", orderBasePath());
      setStep("dishes");
    }
  }, [cartLines.length, confirmation, step]);

  function goToStep(nextStep: OrderStep) {
    if (nextStep === step || (nextStep !== "dishes" && cartLines.length === 0))
      return;
    const suffix =
      nextStep === "details"
        ? orderBasePath() === "/order"
          ? "/details"
          : "/datos"
        : nextStep === "payment"
          ? orderBasePath() === "/order"
            ? "/payment"
            : "/pago"
          : "";
    window.history.pushState({}, "", orderBasePath() + suffix);
    setStep(nextStep);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function continueToPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !contact.name.trim() ||
      !contact.phone.trim() ||
      (fulfillment === "delivery" && !contact.address.trim())
    ) {
      setError(copy.requiredDetails);
      return;
    }
    goToStep("payment");
  }

  function changeQuantity(dishKey: string, delta: number) {
    setCart((current) => {
      const nextQuantity = Math.max(
        0,
        Math.min(99, (current[dishKey] ?? 0) + delta),
      );
      const next = { ...current };
      if (nextQuantity === 0) delete next[dishKey];
      else next[dishKey] = nextQuantity;
      return next;
    });
    setError("");
  }

  function placeOrder() {
    if (
      cartLines.length === 0 ||
      !contact.name.trim() ||
      !contact.phone.trim() ||
      (fulfillment === "delivery" && !contact.address.trim())
    )
      return;
    const name = contact.name.trim();
    const phone = contact.phone.trim();
    const address = contact.address.trim();
    const notes = contact.notes.trim();

    const cartItems = cartLines.map(({ dish, quantity, unitPrice }) => ({
      dishKey: getEditableDishKey(dish),
      name: dish.name,
      quantity,
      unitPrice,
    }));
    const order: OnlineOrder = {
      id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
      source: "online",
      fulfillment,
      phone,
      ...(fulfillment === "delivery" ? { address } : {}),
      createdAt: new Date().toISOString(),
      customer: name,
      table: fulfillment === "pickup" ? "Recogida" : "Domicilio",
      notes,
      items: cartItems
        .map((item) => `${item.quantity} × ${item.name}`)
        .join(", "),
      total: `$${total.toLocaleString("es-CO")} COP`,
      status: "cola",
      dishKeys: cartItems.flatMap((item) =>
        Array.from({ length: item.quantity }, () => item.dishKey),
      ),
      orderLines: cartItems.map((item) => ({
        dishKey: item.dishKey,
        quantity: item.quantity,
      })),
      removedIngredientsByDish: {},
      cartItems,
    };
    try {
      addOnlineOrder(order);
      setConfirmation(order);
      setCart({});
      setError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(copy.saveError);
    }
  }

  if (confirmation) {
    return (
      <section className="min-h-screen bg-[#242424] px-5 pb-20 pt-32 text-zinc-100 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase text-[#e8b45f]">
            {copy.title}
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
            {copy.success}
          </h1>
          <p className="mt-5 text-zinc-300">{copy.successText}</p>
          <p className="mt-6 text-sm font-semibold text-[#e8b45f]">
            {copy.orderNumber}: #{confirmation.id.toString().slice(-8)}
          </p>
          <div className="mt-6 border-y border-white/15 py-5">
            {confirmation.cartItems.map((item) => (
              <p className="py-1" key={item.dishKey}>
                {item.quantity} × {t(item.name)}
              </p>
            ))}
            <p className="mt-4 font-bold">
              {copy.subtotal}:{" "}
              {currency(
                confirmation.cartItems.reduce(
                  (sum, item) => sum + item.quantity * item.unitPrice,
                  0,
                ),
              )}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              className="rounded-sm bg-[#e8b45f] px-5 py-3 font-bold text-zinc-950"
              onClick={() => {
                setConfirmation(null);
                setContact(EMPTY_CONTACT);
                setFulfillment("pickup");
                goToStep("dishes");
              }}
              type="button"
            >
              {copy.another}
            </button>
            <a
              className="rounded-sm border border-white/30 px-5 py-3 font-bold"
              href="/empleados"
              onClick={(event) => navigate("/empleados", event)}
            >
              {copy.viewEmployees}
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#242424] px-5 pb-20 pt-28 text-zinc-100 sm:px-6 sm:pt-36">
      <div className="mx-auto max-w-7xl">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-3 text-zinc-300">{copy.subtitle}</p>
        <p className="mt-5 max-w-4xl border-l-2 border-[#e8b45f] pl-4 text-sm leading-6 text-zinc-400">
          {copy.preview}
        </p>

        <nav
          aria-label={locale === "es" ? "Pasos del pedido" : "Order steps"}
          className="mt-8 border-b border-white/15"
        >
          <ol className="grid grid-cols-3 gap-2">
            {ORDER_STEPS.map((item, index) => (
              <li key={item}>
                <button
                  aria-current={step === item ? "step" : undefined}
                  className={`w-full border-b-2 px-1 pb-4 text-left text-sm font-semibold ${step === item ? "border-[#e8b45f] text-[#e8b45f]" : "border-transparent text-zinc-400"}`}
                  disabled={index > ORDER_STEPS.indexOf(step)}
                  onClick={() => goToStep(item)}
                  type="button"
                >
                  <span className="mr-2 text-xs">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {copy.steps[index]}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          {step === "dishes" ? (
            <div>
              <label
                className="block text-sm font-semibold"
                htmlFor="dish-search"
              >
                {copy.search}
              </label>
              <input
                className="mt-2 w-full rounded-sm border border-zinc-600 bg-[#333333] px-4 py-3 outline-none focus:border-[#e8b45f]"
                id="dish-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
                type="search"
                value={query}
              />
              <div
                className="mt-5 flex flex-wrap gap-2"
                role="group"
                aria-label={locale === "es" ? "Categorías" : "Categories"}
              >
                {categories.map((item) => (
                  <button
                    aria-pressed={category === item}
                    className={`rounded-sm border px-3 py-2 text-sm font-semibold ${category === item ? "border-[#e8b45f] bg-[#e8b45f] text-zinc-950" : "border-zinc-600 text-zinc-200"}`}
                    key={item}
                    onClick={() => setCategory(item)}
                    type="button"
                  >
                    {item === "Todos" ? copy.all : t(item)}
                  </button>
                ))}
              </div>
              <div className="mt-6 grid gap-3">
                {visibleDishes.map((dish) => {
                  const dishKey = getEditableDishKey(dish);
                  const unitPrice = parsePrice(dish.price);
                  return (
                    <article
                      className="grid gap-4 rounded-sm border border-white/10 bg-[#333333] p-4 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center"
                      key={dishKey}
                    >
                      <img
                        alt={t(dish.name)}
                        className="h-28 w-full rounded-sm object-cover sm:h-24"
                        src={
                          dish.image ?? "/images/Plato01.png"
                        }
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase text-[#e8b45f]">
                          {t(dish.categoryTitle)}
                        </p>
                        <h2 className="mt-1 font-display text-xl font-bold">
                          {t(dish.name)}
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-zinc-400">
                          {t(dish.description)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <span className="whitespace-nowrap font-bold text-[#e8b45f]">
                          {unitPrice === null
                            ? copy.unavailablePrice
                            : currency(unitPrice)}
                        </span>
                        <button
                          aria-label={`${copy.add} ${t(dish.name)}`}
                          className="rounded-sm bg-[#e8b45f] px-4 py-2 text-sm font-bold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={
                            unitPrice === null || (cart[dishKey] ?? 0) >= 99
                          }
                          onClick={() => changeQuantity(dishKey, 1)}
                          type="button"
                        >
                          {copy.add}
                        </button>
                      </div>
                    </article>
                  );
                })}
                {visibleDishes.length === 0 ? (
                  <p className="py-10 text-center text-zinc-400">
                    {copy.emptyMenu}
                  </p>
                ) : null}
              </div>
            </div>
          ) : step === "details" ? (
            <div className="min-w-0">
              <form className="max-w-2xl" onSubmit={continueToPayment}>
                <h2 className="font-display text-2xl font-bold">
                  {copy.details}
                </h2>
                <div
                  className="mt-6 grid grid-cols-2 gap-2"
                  role="group"
                  aria-label={copy.details}
                >
                  {FULFILLMENT_OPTIONS.map((option) => (
                    <button
                      aria-pressed={fulfillment === option}
                      className={`rounded-sm border px-3 py-3 text-sm font-semibold ${fulfillment === option ? "border-[#e8b45f] text-[#e8b45f]" : "border-white/20"}`}
                      key={option}
                      onClick={() => setFulfillment(option)}
                      type="button"
                    >
                      {copy[option]}
                    </button>
                  ))}
                </div>
                <div className="mt-6 grid gap-5">
                  {DETAIL_FIELDS.filter(
                    ({ key }) =>
                      key !== "address" || fulfillment === "delivery",
                  ).map(({ key, maxLength, minLength }) => (
                    <label
                      className="grid gap-2 text-sm font-semibold"
                      key={key}
                    >
                      {copy[key]}
                      <input
                        className="rounded-sm border border-zinc-600 bg-[#333333] px-4 py-3 text-white"
                        maxLength={maxLength}
                        minLength={minLength}
                        onChange={(event) =>
                          setContact((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                        required
                        type={key === "phone" ? "tel" : undefined}
                        value={contact[key]}
                      />
                    </label>
                  ))}
                  <label className="grid gap-2 text-sm font-semibold">
                    {copy.notes}
                    <textarea
                      className="min-h-28 rounded-sm border border-zinc-600 bg-[#333333] px-4 py-3 text-white"
                      maxLength={500}
                      onChange={(event) =>
                        setContact((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      placeholder={copy.notesPlaceholder}
                      value={contact.notes}
                    />
                  </label>
                </div>
                {error ? (
                  <p className="mt-4 text-sm text-red-300" role="alert">
                    {error}
                  </p>
                ) : null}
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    className="rounded-sm border border-white/30 px-5 py-3 font-semibold"
                    onClick={() => goToStep("dishes")}
                    type="button"
                  >
                    {copy.backToDishes}
                  </button>
                  <button
                    className="rounded-sm bg-[#e8b45f] px-5 py-3 font-bold text-zinc-950"
                    type="submit"
                  >
                    {copy.nextPayment}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <OrderPaymentStep
              copy={copy}
              contact={contact}
              error={error}
              fulfillment={fulfillment}
              onBack={() => goToStep("details")}
              onPaymentMethodChange={setPaymentMethod}
              onRegister={placeOrder}
              paymentMethod={paymentMethod}
            />
          )}

          <aside
            className="h-fit rounded-sm border border-white/15 bg-[#333333] p-5 lg:sticky lg:top-28"
            aria-label={copy.cart}
          >
            <h2 className="font-display text-2xl font-bold">{copy.cart}</h2>
            {cartLines.length === 0 ? (
              <p className="mt-5 text-sm text-zinc-400">{copy.emptyCart}</p>
            ) : (
              <div className="mt-4 divide-y divide-white/10">
                {cartLines.map(({ dish, quantity, unitPrice }) => {
                  const dishKey = getEditableDishKey(dish);
                  return (
                    <div className="py-4" key={dishKey}>
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold">{t(dish.name)}</span>
                        <span className="whitespace-nowrap text-[#e8b45f]">
                          {currency(unitPrice * quantity)}
                        </span>
                      </div>
                      {step === "dishes" ? (
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            aria-label={`${copy.remove} ${t(dish.name)}`}
                            className="grid h-9 w-9 place-items-center rounded-sm border border-white/20"
                            onClick={() => changeQuantity(dishKey, -1)}
                            type="button"
                          >
                            −
                          </button>
                          <span
                            aria-label={copy.quantity}
                            className="w-7 text-center font-bold"
                          >
                            {quantity}
                          </span>
                          <button
                            aria-label={`${copy.add} ${t(dish.name)}`}
                            className="grid h-9 w-9 place-items-center rounded-sm border border-white/20"
                            onClick={() => changeQuantity(dishKey, 1)}
                            type="button"
                          >
                            +
                          </button>
                          <button
                            className="ml-auto text-xs text-zinc-400 underline"
                            onClick={() =>
                              setCart((current) => {
                                const next = { ...current };
                                delete next[dishKey];
                                return next;
                              })
                            }
                            type="button"
                          >
                            {copy.remove}
                          </button>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-zinc-400">
                          {quantity} × {currency(unitPrice)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-3 flex justify-between border-t border-white/20 pt-4 text-lg font-bold">
              <span>{copy.subtotal}</span>
              <span>{currency(total)}</span>
            </div>

            <div className="mt-6">
              {step === "dishes" ? (
                <button
                  className="w-full rounded-sm bg-[#e8b45f] px-4 py-3 font-bold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={cartLines.length === 0}
                  onClick={() => goToStep("details")}
                  type="button"
                >
                  {copy.nextDetails}
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
