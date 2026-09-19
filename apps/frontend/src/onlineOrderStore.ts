import type { OrderRecord } from "./mocks/employeePanel";

export interface OnlineOrderItem {
  dishKey: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface OnlineOrder extends OrderRecord {
  source: "online";
  fulfillment: "pickup" | "delivery";
  phone: string;
  address?: string;
  createdAt: string;
  cartItems: OnlineOrderItem[];
}

const storageKey = "picasso-online-orders";
const changeEvent = "picasso-online-orders-updated";

export function isOnlineOrder(order: OrderRecord): order is OnlineOrder {
  return "source" in order && order.source === "online";
}

function isStoredOrder(value: unknown): value is OnlineOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<OnlineOrder>;
  return (
    order.source === "online" &&
    typeof order.id === "number" &&
    Number.isSafeInteger(order.id) &&
    typeof order.customer === "string" &&
    typeof order.phone === "string" &&
    typeof order.createdAt === "string" &&
    (order.fulfillment === "pickup" || order.fulfillment === "delivery") &&
    typeof order.items === "string" &&
    typeof order.total === "string" &&
    typeof order.notes === "string" &&
    typeof order.table === "string" &&
    Array.isArray(order.orderLines) &&
    Array.isArray(order.cartItems) &&
    order.cartItems.every(
      (item) =>
        item &&
        typeof item.dishKey === "string" &&
        typeof item.name === "string" &&
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0 &&
        Number.isFinite(item.unitPrice),
    )
  );
}

export function getOnlineOrders(): OnlineOrder[] {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isStoredOrder) : [];
  } catch {
    return [];
  }
}

export function saveOnlineOrders(orders: OnlineOrder[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(orders));
  window.dispatchEvent(new Event(changeEvent));
}

export function addOnlineOrder(order: OnlineOrder) {
  saveOnlineOrders([order, ...getOnlineOrders()]);
}

export function subscribeOnlineOrders(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) listener();
  };
  window.addEventListener(changeEvent, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(changeEvent, listener);
    window.removeEventListener("storage", onStorage);
  };
}
