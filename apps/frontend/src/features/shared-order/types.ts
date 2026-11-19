export type SharedOrderStatus = "open" | "submitting" | "submitted";

export interface SharedOrderLine {
  id: number;
  itemId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  notes: string;
  addedBy: string;
  addedByName: string;
}

export interface SharedOrderParticipant {
  id: string;
  name: string;
  online: boolean;
}

export interface SharedOrderView {
  code: string;
  tableId: number;
  status: SharedOrderStatus;
  version: number;
  participants: SharedOrderParticipant[];
  lines: SharedOrderLine[];
  total: number;
  orderId: number | null;
}

export type Ack<T extends object = object> =
  ({ status: "ok" } & T) | { status: "error"; message?: string | string[] };

export const CODE_PATTERN = /^[A-Z0-9]{6}$/;
export const MAX_NAME_LENGTH = 30;
export const MAX_NOTES_LENGTH = 140;

export function isView(value: unknown): value is SharedOrderView {
  if (!value || typeof value !== "object") return false;
  const view = value as SharedOrderView;
  return (
    typeof view.code === "string" &&
    typeof view.version === "number" &&
    typeof view.total === "number" &&
    Array.isArray(view.participants) &&
    Array.isArray(view.lines)
  );
}
