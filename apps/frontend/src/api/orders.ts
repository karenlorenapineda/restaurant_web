import { request } from "./client";
export type ApiOrderStatus =
  "queued" | "preparing" | "ready" | "completed" | "cancelled";
export const transitions: Record<ApiOrderStatus, ApiOrderStatus[]> = {
  queued: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};
export interface CreateOrder {
  type: "dine_in" | "takeaway" | "delivery";
  tableId?: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: {
    itemId: number;
    quantity: number;
    notes?: string;
    modifications?: { recipeId: number }[];
  }[];
}
export interface CreatedOrder {
  id: number;
  total: string;
  orderDate: string;
  status: ApiOrderStatus;
}
export function createOrder(data: CreateOrder) {
  return request<CreatedOrder>("orders", { method: "POST", body: data }).then(
    (order) => {
      if (
        !Number.isSafeInteger(order.id) ||
        typeof order.total !== "string" ||
        !Number.isFinite(Number(order.total)) ||
        typeof order.orderDate !== "string"
      )
        throw new Error("Invalid order response");
      return order;
    },
  );
}
export const updateOrderStatus = (id: number, status: ApiOrderStatus) =>
  request(`orders/${id}/status`, { method: "PATCH", body: { status } });
