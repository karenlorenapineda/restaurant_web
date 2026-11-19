import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";

import { isView } from "./types";
import type { Ack, SharedOrderView } from "./types";

const STORAGE_KEY = "picasso.sharedOrder";
const ACK_TIMEOUT_MS = 8_000;

interface Saved {
  code: string;
  token: string;
  name: string;
}

export type SharedOrderPhase = "lobby" | "joined" | "closed";

export interface SharedOrderState {
  phase: SharedOrderPhase;
  view: SharedOrderView | null;
  participantId: string | null;
  connected: boolean;
  /** Waiting for the server to answer create, join or send. */
  busy: boolean;
  /** The server's message (English) or a client code such as "offline". */
  error: string | null;
  closedReason: string | null;
  /** The person had a table before a refresh and is being put back in it. */
  restoring: boolean;
}

function readSaved(): Saved | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Saved>;
    return typeof value.code === "string" &&
      typeof value.token === "string" &&
      typeof value.name === "string"
      ? (value as Saved)
      : null;
  } catch {
    return null;
  }
}

function writeSaved(saved: Saved | null) {
  try {
    if (saved)
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode: the table still works, it just is not restored on refresh.
  }
}

const messageOf = (ack: Ack) =>
  ack.status === "ok"
    ? null
    : Array.isArray(ack.message)
      ? ack.message.join("; ")
      : (ack.message ?? "error");

/**
 * Connects to the shared table order and keeps its state. The server is the
 * only source of truth: every change is sent to it, and the screen only shows
 * the numbered snapshots it sends back (older ones are ignored).
 */
export function useSharedOrder(enabled = true) {
  const [state, setState] = useState<SharedOrderState>(() => ({
    phase: "lobby",
    view: null,
    participantId: null,
    connected: false,
    busy: false,
    error: null,
    closedReason: null,
    restoring: enabled && readSaved() !== null,
  }));
  const socket = useRef<Socket | null>(null);
  const session = useRef<Saved | null>(readSaved());
  const version = useRef(0);

  const patch = useCallback(
    (changes: Partial<SharedOrderState>) =>
      setState((current) => ({ ...current, ...changes })),
    [],
  );

  const enter = useCallback(
    (reply: Record<string, unknown>, name: string) => {
      if (
        !isView(reply.view) ||
        typeof reply.participantId !== "string" ||
        typeof reply.token !== "string"
      ) {
        patch({ busy: false, restoring: false, error: "invalid response" });
        return;
      }
      session.current = { code: reply.view.code, token: reply.token, name };
      writeSaved(session.current);
      version.current = reply.view.version;
      patch({
        phase: "joined",
        view: reply.view,
        participantId: reply.participantId,
        busy: false,
        restoring: false,
        error: null,
        closedReason: null,
      });
    },
    [patch],
  );

  const forget = useCallback(
    (closedReason: string | null) => {
      session.current = null;
      writeSaved(null);
      version.current = 0;
      patch({
        phase: closedReason ? "closed" : "lobby",
        view: null,
        participantId: null,
        busy: false,
        restoring: false,
        closedReason,
      });
    },
    [patch],
  );

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const client = io("/shared-orders", { autoConnect: false });
    socket.current = client;

    const rejoin = () => {
      const saved = session.current;
      if (!saved) return;
      client
        .timeout(ACK_TIMEOUT_MS)
        .emit(
          "join",
          { code: saved.code, name: saved.name, token: saved.token },
          (error: Error | null, reply: Ack<Record<string, unknown>>) => {
            if (!active) return;
            if (error) {
              patch({ restoring: false, error: "timeout" });
              return;
            }
            if (reply.status === "ok") enter(reply, saved.name);
            else forget("gone");
          },
        );
    };

    client.on("connect", () => {
      if (!active) return;
      patch({ connected: true, error: null });
      rejoin();
    });
    client.on("disconnect", () => active && patch({ connected: false }));
    client.on("connect_error", () => active && patch({ connected: false }));
    client.on("session:update", (view: unknown) => {
      if (!active || !isView(view) || view.code !== session.current?.code)
        return;
      if (view.version <= version.current) return;
      version.current = view.version;
      patch({ view });
    });
    client.on("session:closed", (payload: { reason?: string } | undefined) => {
      if (active) forget(payload?.reason ?? "gone");
    });
    client.connect();

    return () => {
      active = false;
      client.removeAllListeners();
      client.close();
      socket.current = null;
    };
  }, [enabled, enter, forget, patch]);

  const send = useCallback(
    (event: string, payload?: unknown) =>
      new Promise<Ack<Record<string, unknown>>>((resolve) => {
        const client = socket.current;
        if (!client?.connected) {
          resolve({ status: "error", message: "offline" });
          return;
        }
        client
          .timeout(ACK_TIMEOUT_MS)
          .emit(
            event,
            payload,
            (error: Error | null, reply: Ack<Record<string, unknown>>) =>
              resolve(error ? { status: "error", message: "timeout" } : reply),
          );
      }),
    [],
  );

  /** Runs an edit and shows the server's error, if any. The new state arrives as an update. */
  const edit = useCallback(
    async (event: string, payload?: unknown) => {
      const reply = await send(event, payload);
      const message = messageOf(reply);
      patch({ error: message });
      return reply.status === "ok";
    },
    [patch, send],
  );

  const create = useCallback(
    async (name: string, tableId: number) => {
      patch({ busy: true, error: null });
      const reply = await send("create", { name, tableId });
      if (reply.status === "ok") enter(reply, name);
      else patch({ busy: false, error: messageOf(reply) });
    },
    [enter, patch, send],
  );

  const join = useCallback(
    async (code: string, name: string) => {
      patch({ busy: true, error: null });
      const reply = await send("join", { code, name });
      if (reply.status === "ok") enter(reply, name);
      else patch({ busy: false, error: messageOf(reply) });
    },
    [enter, patch, send],
  );

  const submit = useCallback(async () => {
    patch({ busy: true, error: null });
    const reply = await send("submit");
    const message = messageOf(reply);
    // Someone else pressed send a moment earlier: the order is on its way and
    // the update that follows says so, so this is not an error for the person.
    const lostTheRace =
      message === "This order has already been sent" ||
      message === "The order is being sent";
    patch({ busy: false, error: lostTheRace ? null : message });
  }, [patch, send]);

  const leave = useCallback(async () => {
    await send("leave");
    forget(null);
  }, [forget, send]);

  return {
    state,
    create,
    join,
    submit,
    leave,
    addItem: (itemId: number, quantity = 1) =>
      edit("add-item", { itemId, quantity }),
    setQuantity: (lineId: number, quantity: number) =>
      edit("set-quantity", { lineId, quantity }),
    setNotes: (lineId: number, notes: string) =>
      edit("set-notes", { lineId, notes }),
    removeLine: (lineId: number) => edit("remove-item", { lineId }),
    dismissError: () => patch({ error: null }),
    startOver: () => forget(null),
  };
}
