export type SharedOrderStatus = "open" | "submitting" | "submitted";

export interface SharedOrderLine {
  id: number;
  itemId: number;
  name: string;
  /** Price read from the database when the dish was added. */
  unitPrice: number;
  quantity: number;
  notes: string;
  /** Public id of the participant who added the line. */
  addedBy: string;
  /** Name at the time, so the line still reads well if the person leaves. */
  addedByName: string;
}

export interface SharedOrderParticipant {
  id: string;
  name: string;
  online: boolean;
}

/** What every participant sees. It never contains reconnection tokens. */
export interface SharedOrderView {
  code: string;
  tableId: number;
  status: SharedOrderStatus;
  /** Grows with every change, so a client can ignore an older update. */
  version: number;
  participants: SharedOrderParticipant[];
  lines: SharedOrderLine[];
  total: number;
  orderId: number | null;
}

export interface JoinResult {
  view: SharedOrderView;
  participantId: string;
  /** Secret that lets this participant recover their place after a reconnect. */
  token: string;
}

export type Ack<T extends object = object> =
  ({ status: "ok" } & T) | { status: "error"; message: string | string[] };
