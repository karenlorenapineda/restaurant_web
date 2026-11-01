export const demoMode = () => import.meta.env.VITE_DATA_MODE === "demo";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method: options.method ?? "GET",
    credentials: "same-origin",
    signal: options.signal
      ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
      : AbortSignal.timeout(15000),
    headers: {
      Accept: "application/json",
      ...(options.body === undefined
        ? {}
        : { "Content-Type": "application/json" }),
    },
    ...(options.body === undefined
      ? {}
      : { body: JSON.stringify(options.body) }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? payload.message
        : null;
    throw new ApiError(
      response.status,
      Array.isArray(message)
        ? message.join(" · ")
        : typeof message === "string"
          ? message
          : `HTTP ${response.status}`,
    );
  }
  if (payload === null) throw new ApiError(502, "Invalid API response");
  return payload as T;
}

export type Row = Record<string, unknown> & { id: number };
export async function listRows(
  path: string,
  signal?: AbortSignal,
): Promise<Row[]> {
  const rows = await request<unknown>(path, { signal });
  if (
    !Array.isArray(rows) ||
    !rows.every(
      (row) =>
        row &&
        typeof row === "object" &&
        Number.isSafeInteger(row.id) &&
        row.id > 0,
    )
  )
    throw new ApiError(502, "Invalid API response");
  const text = (value: unknown): value is string => typeof value === "string";
  const optionalText = (value: unknown) => value == null || text(value);
  const decimal = (value: unknown) =>
    (text(value) || typeof value === "number") &&
    Number.isFinite(Number(value));
  const money = (value: unknown) => {
    try {
      return text(value) && Number.isFinite(parseCop(value));
    } catch {
      return false;
    }
  };
  const valid = rows.every((row) => {
    if (path === "orders")
      return (
        text(row.customer) &&
        text(row.tableOrLocation) &&
        money(row.total) &&
        ["queued", "preparing", "ready", "completed", "cancelled"].includes(
          row.status,
        ) &&
        Array.isArray(row.items) &&
        row.items.every(
          (item: Record<string, unknown>) =>
            item &&
            Number.isSafeInteger(item.itemId) &&
            text(item.name) &&
            Number.isInteger(item.quantity) &&
            optionalText(item.notes) &&
            Array.isArray(item.removedIngredients) &&
            item.removedIngredients.every(text),
        )
      );
    if (!text(row.name)) return false;
    if (path === "menu/management")
      return (
        optionalText(row.description) &&
        text(row.category) &&
        money(row.price) &&
        optionalText(row.image) &&
        optionalText(row.recipe) &&
        [row.active, row.featured, row.showImage].every(
          (value) => typeof value === "boolean",
        )
      );
    if (path === "supplies" || path === "inventory")
      return (
        money(row.const) &&
        decimal(row.stock) &&
        decimal(row.threshold) &&
        text(row.unit)
      );
    if (path === "employees")
      return (
        text(row.email) &&
        optionalText(row.phone) &&
        text(row.position) &&
        text(row.role) &&
        typeof row.active === "boolean"
      );
    if (path === "units")
      return (
        text(row.abbreviation) &&
        ["weight", "volume", "count"].includes(row.type) &&
        decimal(row.baseFactor)
      );
    return true;
  });
  if (!valid) throw new ApiError(502, "Invalid API response");
  return rows as Row[];
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Error";

// COP strings from GET endpoints are display values, never payload numbers.
export function parseCop(value: string): number {
  const raw = value.replace(/\s|COP|\$/g, "");
  if (
    !/^\d+(?:\.\d{3})*(?:,\d{1,2})?$/.test(raw) &&
    !/^\d+(?:,\d{1,2})?$/.test(raw)
  )
    throw new Error("Invalid COP amount");
  const amount = Number(raw.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(amount)) throw new Error("Invalid COP amount");
  return amount;
}
