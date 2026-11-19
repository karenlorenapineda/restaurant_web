import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setLocale } from "../i18n";
import type { SharedOrderView } from "../features/shared-order/types";
import { SharedOrderPage } from "./SharedOrderPage";

type Handler = (payload: unknown) => void;

const mocks = vi.hoisted(() => {
  class FakeSocket {
    connected = false;
    handlers = new Map<string, Handler[]>();
    sent: Array<{ event: string; payload: unknown }> = [];
    on(event: string, handler: Handler) {
      this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler]);
      return this;
    }
    removeAllListeners() {
      this.handlers.clear();
    }
    connect() {
      queueMicrotask(() => this.fire("connect"));
      this.connected = true;
    }
    close() {
      this.connected = false;
    }
    timeout() {
      return {
        emit: (
          event: string,
          payload: unknown,
          callback: (error: Error | null, reply: unknown) => void,
        ) => {
          this.sent.push({ event, payload });
          const reply = mocks.respond(event, payload);
          queueMicrotask(() => callback(null, reply));
        },
      };
    }
    fire(event: string, payload?: unknown) {
      for (const handler of this.handlers.get(event) ?? []) handler(payload);
    }
  }
  const state = {
    sockets: [] as FakeSocket[],
    io: vi.fn(),
    respond: (_event: string, _payload: unknown): unknown => ({ status: "ok" }),
    tables: [
      { id: 5, tableNumber: "5", capacity: 4 },
      { id: 6, tableNumber: "Terraza", capacity: 6 },
    ] as unknown[],
  };
  return { FakeSocket, ...state, state };
});

vi.mock("socket.io-client", () => ({
  io: (...args: unknown[]) => {
    mocks.io(...args);
    const socket = new mocks.FakeSocket();
    mocks.sockets.push(socket);
    return socket;
  },
}));

vi.mock("../api/client", async (original) => ({
  ...(await original<typeof import("../api/client")>()),
  request: vi.fn(async () => mocks.tables),
}));

vi.mock("../api/usePublicMenu", () => ({
  usePublicMenu: () => ({
    loading: false,
    error: false,
    retry: () => undefined,
    sections: [
      {
        id: 1,
        title: "Arroces",
        items: [
          { id: 10, name: "Paella", price: "$ 12.500", description: "" },
          {
            id: 11,
            name: "Agotado",
            price: "$ 1",
            description: "",
            available: false,
          },
        ],
      },
    ],
  }),
}));

const view = (changes: Partial<SharedOrderView> = {}): SharedOrderView => ({
  code: "ABC234",
  tableId: 5,
  status: "open",
  version: 1,
  participants: [
    { id: "p1", name: "Ana", online: true },
    { id: "p2", name: "Luis", online: false },
  ],
  lines: [],
  total: 0,
  orderId: null,
  ...changes,
});

const withLine = (changes: Partial<SharedOrderView> = {}) =>
  view({
    version: 2,
    lines: [
      {
        id: 1,
        itemId: 10,
        name: "Paella",
        unitPrice: 12500,
        quantity: 2,
        notes: "sin gambas",
        addedBy: "p2",
        addedByName: "Luis",
      },
    ],
    total: 25000,
    ...changes,
  });

const joinedReply = (v: SharedOrderView = view()) => ({
  status: "ok",
  view: v,
  participantId: "p1",
  token: "secret-token",
});

const socket = () => mocks.sockets[mocks.sockets.length - 1]!;
const sentEvents = () => socket().sent.map((item) => item.event);

async function renderConnected() {
  render(<SharedOrderPage navigate={vi.fn()} />);
  await screen.findByRole("form", { name: "Crear un pedido de mesa" });
}

async function createTable() {
  mocks.respond = (event) =>
    event === "create" ? joinedReply() : { status: "ok" };
  await renderConnected();
  fireEvent.change(screen.getByLabelText("Tu nombre"), {
    target: { value: "Ana" },
  });
  fireEvent.change(screen.getByLabelText("Mesa"), { target: { value: "5" } });
  fireEvent.click(screen.getByRole("button", { name: "Crear pedido" }));
  await screen.findByText("ABC234");
}

beforeEach(() => {
  setLocale("es");
  vi.stubEnv("VITE_DATA_MODE", "api");
  window.history.replaceState({}, "", "/mesa");
  window.sessionStorage.clear();
  mocks.sockets.length = 0;
  mocks.io.mockClear();
  mocks.respond = () => ({ status: "ok" });
  mocks.tables = [
    { id: 5, tableNumber: "5", capacity: 4 },
    { id: 6, tableNumber: "Terraza", capacity: 6 },
  ];
});

afterEach(() => {
  vi.unstubAllEnvs();
  window.history.replaceState({}, "", "/");
});

describe("SharedOrderPage", () => {
  it("does not connect in demo mode", () => {
    vi.stubEnv("VITE_DATA_MODE", "demo");
    render(<SharedOrderPage navigate={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "necesita la API real",
    );
    expect(mocks.io).not.toHaveBeenCalled();
  });

  it("connects to the shared-orders namespace and shows the tables", async () => {
    await renderConnected();
    expect(mocks.io).toHaveBeenCalledWith("/shared-orders", {
      autoConnect: false,
    });
    expect(
      await screen.findByRole("option", { name: "Mesa Terraza (6 personas)" }),
    ).toBeInTheDocument();
  });

  it("asks for a name, a table and a valid code before sending anything", async () => {
    await renderConnected();

    fireEvent.click(screen.getByRole("button", { name: "Crear pedido" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Escribe tu nombre");

    fireEvent.change(screen.getByLabelText("Tu nombre"), {
      target: { value: "Ana" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear pedido" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Elige una mesa");

    fireEvent.change(screen.getByLabelText("Código de la mesa"), {
      target: { value: "ab" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Unirme" }));
    expect(screen.getByRole("alert")).toHaveTextContent("6 letras o números");

    fireEvent.change(screen.getByLabelText("Tu nombre"), {
      target: { value: "x".repeat(40) },
    });
    expect(sentEvents()).toEqual([]);
  });

  it("creates a table order and shows the code, the people and the empty order", async () => {
    await createTable();

    expect(socket().sent).toContainEqual({
      event: "create",
      payload: { name: "Ana", tableId: 5 },
    });
    expect(
      screen.getByText("Todavía no hay platos. Añade el primero de la carta."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Luis/)).toHaveAttribute("data-online", "false");
    expect(screen.getByText(/Ana/)).toHaveAttribute("data-online", "true");
    expect(
      screen.getByRole("button", { name: "Enviar pedido a cocina" }),
    ).toBeDisabled();
  });

  it("joins with the code from the link, in capitals", async () => {
    window.history.replaceState({}, "", "/mesa?codigo=abc234");
    mocks.respond = (event) =>
      event === "join" ? joinedReply() : { status: "ok" };
    await renderConnected();

    expect(screen.getByLabelText("Código de la mesa")).toHaveValue("ABC234");
    fireEvent.change(screen.getByLabelText("Tu nombre"), {
      target: { value: "  Luis   Gil " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Unirme" }));

    await screen.findByText("ABC234");
    expect(socket().sent).toContainEqual({
      event: "join",
      payload: { code: "ABC234", name: "Luis Gil" },
    });
  });

  it("sends each edit to the server and waits for its update before showing it", async () => {
    await createTable();

    fireEvent.click(screen.getByRole("button", { name: "Añadir: Paella" }));
    expect(socket().sent.at(-1)).toEqual({
      event: "add-item",
      payload: { itemId: 10, quantity: 1 },
    });
    expect(screen.queryByText("Agotado")).not.toBeInTheDocument();
    expect(
      screen.getByText("Todavía no hay platos. Añade el primero de la carta."),
    ).toBeInTheDocument();

    act(() => socket().fire("session:update", withLine()));
    expect(screen.getByText("añadido por Luis")).toBeInTheDocument();
    expect(screen.getByLabelText("Cantidad de Paella")).toHaveTextContent("2");
    expect(screen.getAllByText(/25\.000/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Más: Paella" }));
    expect(socket().sent.at(-1)).toEqual({
      event: "set-quantity",
      payload: { lineId: 1, quantity: 3 },
    });
    fireEvent.click(screen.getByRole("button", { name: "Menos: Paella" }));
    expect(socket().sent.at(-1)).toEqual({
      event: "set-quantity",
      payload: { lineId: 1, quantity: 1 },
    });
    fireEvent.click(screen.getByRole("button", { name: "Quitar: Paella" }));
    expect(socket().sent.at(-1)).toEqual({
      event: "remove-item",
      payload: { lineId: 1 },
    });

    const notes = screen.getByLabelText("Notas de Paella");
    fireEvent.focus(notes);
    fireEvent.change(notes, { target: { value: "  poco hecha " } });
    fireEvent.blur(notes);
    expect(socket().sent.at(-1)).toEqual({
      event: "set-notes",
      payload: { lineId: 1, notes: "poco hecha" },
    });
  });

  it("does not let you take a dish below one unit", async () => {
    await createTable();
    act(() =>
      socket().fire(
        "session:update",
        withLine({ lines: [{ ...withLine().lines[0]!, quantity: 1 }] }),
      ),
    );
    expect(
      screen.getByRole("button", { name: "Menos: Paella" }),
    ).toBeDisabled();
  });

  it("ignores old, repeated and foreign updates", async () => {
    await createTable();
    act(() => socket().fire("session:update", withLine({ version: 5 })));
    expect(screen.getByLabelText("Cantidad de Paella")).toHaveTextContent("2");

    act(() => socket().fire("session:update", view({ version: 4 })));
    act(() => socket().fire("session:update", view({ version: 5 })));
    act(() =>
      socket().fire(
        "session:update",
        withLine({ version: 9, code: "ZZZZZZ", total: 1 }),
      ),
    );
    act(() => socket().fire("session:update", { nonsense: true }));
    expect(screen.getByLabelText("Cantidad de Paella")).toHaveTextContent("2");
    expect(screen.queryByText(/\$\s?1$/)).not.toBeInTheDocument();
  });

  it("keeps what you are typing when someone else changes the same note", async () => {
    await createTable();
    act(() => socket().fire("session:update", withLine()));
    const notes = screen.getByLabelText("Notas de Paella");
    fireEvent.focus(notes);
    fireEvent.change(notes, { target: { value: "mi nota" } });

    act(() =>
      socket().fire(
        "session:update",
        withLine({
          version: 3,
          lines: [{ ...withLine().lines[0]!, notes: "de otro" }],
        }),
      ),
    );
    expect(notes).toHaveValue("mi nota");

    fireEvent.blur(notes);
    act(() =>
      socket().fire(
        "session:update",
        withLine({
          version: 4,
          lines: [{ ...withLine().lines[0]!, notes: "final" }],
        }),
      ),
    );
    expect(notes).toHaveValue("final");
  });

  it("shows server errors in the chosen language and lets you dismiss them", async () => {
    await createTable();
    mocks.respond = () => ({ status: "error", message: "Dish not available" });
    fireEvent.click(screen.getByRole("button", { name: "Añadir: Paella" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ese plato no está disponible ahora.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    mocks.respond = () => ({
      status: "error",
      message: "something with a secret path /etc/passwd",
    });
    fireEvent.click(screen.getByRole("button", { name: "Añadir: Paella" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No se pudo completar la acción.");
    expect(alert).not.toHaveTextContent("passwd");
  });

  it("explains a lost connection and puts the person back after reconnecting", async () => {
    await createTable();
    act(() => socket().fire("disconnect"));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Sin conexión. Reconectando",
    );
    mocks.respond = (event) =>
      event === "join"
        ? joinedReply(withLine({ version: 7 }))
        : { status: "ok" };

    act(() => {
      socket().connected = true;
      socket().fire("connect");
    });

    await waitFor(() =>
      expect(screen.queryByText(/Reconectando/)).not.toBeInTheDocument(),
    );
    expect(socket().sent.at(-1)).toEqual({
      event: "join",
      payload: { code: "ABC234", name: "Ana", token: "secret-token" },
    });
    await waitFor(() =>
      expect(screen.getByLabelText("Cantidad de Paella")).toBeInTheDocument(),
    );
  });

  it("does not send edits while offline", async () => {
    await createTable();
    socket().connected = false;
    act(() => socket().fire("disconnect"));
    const before = socket().sent.length;
    fireEvent.click(screen.getByRole("button", { name: "Añadir: Paella" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No hay conexión con el servidor.",
    );
    expect(socket().sent.length).toBe(before);
  });

  it("returns to the saved table after a page refresh", async () => {
    window.sessionStorage.setItem(
      "picasso.sharedOrder",
      JSON.stringify({ code: "ABC234", token: "secret-token", name: "Ana" }),
    );
    mocks.respond = (event) =>
      event === "join" ? joinedReply(withLine()) : { status: "ok" };
    render(<SharedOrderPage navigate={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("Volviendo a tu mesa");
    await screen.findByText("ABC234");
    expect(socket().sent[0]).toEqual({
      event: "join",
      payload: { code: "ABC234", name: "Ana", token: "secret-token" },
    });
  });

  it("says the table is gone when it can no longer be recovered", async () => {
    window.sessionStorage.setItem(
      "picasso.sharedOrder",
      JSON.stringify({ code: "ABC234", token: "old", name: "Ana" }),
    );
    mocks.respond = () => ({
      status: "error",
      message: "Shared order not found",
    });
    render(<SharedOrderPage navigate={vi.fn()} />);

    expect(
      await screen.findByText("Esta mesa ya no está disponible"),
    ).toBeInTheDocument();
    expect(window.sessionStorage.getItem("picasso.sharedOrder")).toBeNull();
  });

  it("tells everyone when the server closes the table", async () => {
    await createTable();
    act(() => socket().fire("session:closed", { reason: "expired" }));
    expect(
      screen.getByText("Esta mesa ya no está disponible"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Llevaba demasiado tiempo sin actividad."),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Empezar otro pedido" }),
    );
    expect(
      screen.getByRole("form", { name: "Crear un pedido de mesa" }),
    ).toBeInTheDocument();
  });

  it("sends the order and then blocks edits", async () => {
    await createTable();
    act(() => socket().fire("session:update", withLine()));
    mocks.respond = (event) =>
      event === "submit" ? { status: "ok", orderId: 901 } : { status: "ok" };
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar pedido a cocina" }),
    );
    await waitFor(() => expect(sentEvents()).toContain("submit"));

    act(() =>
      socket().fire(
        "session:update",
        withLine({ version: 5, status: "submitted", orderId: 901 }),
      ),
    );

    expect(screen.getByText("¡Pedido enviado a cocina!")).toBeInTheDocument();
    expect(screen.getByText("Número de pedido: 901.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Enviar pedido a cocina" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Añadir: Paella" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Más: Paella" })).toBeDisabled();
    expect(screen.getByLabelText("Notas de Paella")).toBeDisabled();
  });

  it("does not show an error to the person who pressed send a moment after someone else", async () => {
    await createTable();
    act(() => socket().fire("session:update", withLine()));
    mocks.respond = (event) =>
      event === "submit"
        ? { status: "error", message: "This order has already been sent" }
        : { status: "ok" };
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar pedido a cocina" }),
    );
    await waitFor(() => expect(sentEvents()).toContain("submit"));
    await act(async () => undefined);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    mocks.respond = (event) =>
      event === "submit"
        ? { status: "error", message: "Add at least one dish first" }
        : { status: "ok" };
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar pedido a cocina" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Añade al menos un plato",
    );
  });

  it("locks the send button while the order is being sent", async () => {
    await createTable();
    act(() =>
      socket().fire("session:update", withLine({ status: "submitting" })),
    );
    expect(screen.getByRole("button", { name: /Enviando/ })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Añadir: Paella" }),
    ).toBeDisabled();
  });

  it("leaves the table and forgets it", async () => {
    await createTable();
    expect(window.sessionStorage.getItem("picasso.sharedOrder")).toContain(
      "secret-token",
    );
    fireEvent.click(screen.getByRole("button", { name: "Salir de la mesa" }));

    await screen.findByRole("form", { name: "Crear un pedido de mesa" });
    expect(sentEvents()).toContain("leave");
    expect(window.sessionStorage.getItem("picasso.sharedOrder")).toBeNull();
  });

  it("copies the invitation link", async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    await createTable();
    fireEvent.click(screen.getByRole("button", { name: "Copiar enlace" }));
    await screen.findByRole("button", { name: "Enlace copiado" });
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/mesa?codigo=ABC234`,
    );
    vi.unstubAllGlobals();
  });

  it("speaks English and Portuguese", async () => {
    setLocale("en");
    render(<SharedOrderPage navigate={vi.fn()} />);
    expect(
      await screen.findByRole("form", { name: "Start a table order" }),
    ).toBeInTheDocument();
  });
});
