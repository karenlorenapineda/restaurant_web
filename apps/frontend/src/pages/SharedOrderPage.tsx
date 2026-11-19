import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { demoMode, request } from "../api/client";
import { usePublicMenu } from "../api/usePublicMenu";
import { Button, Input, Select } from "../components/ui/controls";
import { Field, Panel } from "../features/employee-panel/shared";
import { useSharedOrder } from "../features/shared-order/useSharedOrder";
import {
  CODE_PATTERN,
  MAX_NAME_LENGTH,
  MAX_NOTES_LENGTH,
} from "../features/shared-order/types";
import type {
  SharedOrderLine,
  SharedOrderView,
} from "../features/shared-order/types";
import { useLocale } from "../i18n";
import type { NavigationHandlers } from "../navigation";
import { SHARED_ORDER_COPY, errorText, formatMoney } from "../sharedOrderCopy";
import type { SharedOrderCopy } from "../sharedOrderCopy";

interface TableOption {
  id: number;
  tableNumber: string;
  capacity: number;
}

function parseTables(value: unknown): TableOption[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (row): row is TableOption =>
      !!row &&
      typeof row.id === "number" &&
      typeof row.tableNumber === "string" &&
      typeof row.capacity === "number",
  );
}

function codeFromUrl(): string {
  const code = new URLSearchParams(window.location.search).get("codigo") ?? "";
  return code.trim().toUpperCase().slice(0, 6);
}

export function SharedOrderPage({
  navigate,
}: Pick<NavigationHandlers, "navigate">) {
  const locale = useLocale();
  const copy = SHARED_ORDER_COPY[locale];
  const demo = demoMode();
  const shared = useSharedOrder(!demo);
  const { state } = shared;
  const [tables, setTables] = useState<TableOption[]>([]);
  const [tablesFailed, setTablesFailed] = useState(false);

  useEffect(() => {
    if (demo) return;
    const controller = new AbortController();
    request<unknown>("tables", { signal: controller.signal })
      .then((rows) => setTables(parseTables(rows)))
      .catch(() => {
        if (!controller.signal.aborted) setTablesFailed(true);
      });
    return () => controller.abort();
  }, [demo]);

  return (
    <section className="min-h-screen bg-[#242424] px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
      <div className="mx-auto grid max-w-6xl gap-7">
        <header>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
            {copy.subtitle}
          </p>
        </header>

        {demo ? (
          <Panel>
            <p role="status">{copy.demo}</p>
          </Panel>
        ) : (
          <>
            {!state.connected && (
              <p
                role="status"
                className="rounded-sm border border-[#e8b45f] bg-zinc-900 px-4 py-3"
              >
                {state.restoring ? copy.restoring : copy.reconnecting}
              </p>
            )}
            {state.error && (
              <div
                role="alert"
                className="flex items-start justify-between gap-4 rounded-sm border border-[var(--ui-danger)] bg-zinc-900 px-4 py-3"
              >
                <span>{errorText(state.error, copy)}</span>
                <button
                  type="button"
                  className="shrink-0 underline"
                  onClick={shared.dismissError}
                >
                  {copy.dismiss}
                </button>
              </div>
            )}

            {state.phase === "closed" && (
              <Panel>
                <h2 className="font-display text-2xl font-bold">
                  {copy.closedTitle}
                </h2>
                <p className="mt-3 text-zinc-300">
                  {copy.closed[state.closedReason ?? "gone"] ??
                    copy.closed.gone}
                </p>
                <Button className="mt-5" onClick={shared.startOver}>
                  {copy.newTable}
                </Button>
              </Panel>
            )}

            {state.phase === "lobby" && (
              <Lobby
                copy={copy}
                tables={tables}
                tablesFailed={tablesFailed}
                busy={state.busy}
                disabled={!state.connected}
                onCreate={shared.create}
                onJoin={shared.join}
              />
            )}

            {state.phase === "joined" && state.view && (
              <Table
                copy={copy}
                view={state.view}
                tables={tables}
                participantId={state.participantId}
                busy={state.busy}
                shared={shared}
                navigate={navigate}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}

function Lobby({
  copy,
  tables,
  tablesFailed,
  busy,
  disabled,
  onCreate,
  onJoin,
}: {
  copy: SharedOrderCopy;
  tables: TableOption[];
  tablesFailed: boolean;
  busy: boolean;
  disabled: boolean;
  onCreate: (name: string, tableId: number) => Promise<void>;
  onJoin: (code: string, name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [tableId, setTableId] = useState("");
  const [code, setCode] = useState(codeFromUrl);
  const [problem, setProblem] = useState<string | null>(null);

  const cleanName = name.replace(/\s+/g, " ").trim();
  const nameProblem =
    cleanName.length === 0 || cleanName.length > MAX_NAME_LENGTH
      ? copy.nameRequired
      : null;

  function create(event: FormEvent) {
    event.preventDefault();
    if (nameProblem) return setProblem(nameProblem);
    if (!tableId) return setProblem(copy.tableRequired);
    setProblem(null);
    void onCreate(cleanName, Number(tableId));
  }

  function join(event: FormEvent) {
    event.preventDefault();
    if (nameProblem) return setProblem(nameProblem);
    const cleanCode = code.trim().toUpperCase();
    if (!CODE_PATTERN.test(cleanCode)) return setProblem(copy.codeInvalid);
    setProblem(null);
    void onJoin(cleanCode, cleanName);
  }

  return (
    <>
      <Panel>
        <Field label={copy.yourName}>
          <Input
            value={name}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="nickname"
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        {problem && (
          <p role="alert" className="mt-3 text-sm text-[var(--ui-danger)]">
            {problem}
          </p>
        )}
      </Panel>
      <div className="grid gap-7 lg:grid-cols-2">
        <Panel>
          <form onSubmit={create} noValidate aria-label={copy.createTitle}>
            <h2 className="mb-4 font-display text-2xl font-bold">
              {copy.createTitle}
            </h2>
            <Field label={copy.table}>
              <Select
                value={tableId}
                onChange={(event) => setTableId(event.target.value)}
              >
                <option value="">{copy.chooseTable}</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {copy.tableLabel(table.tableNumber, table.capacity)}
                  </option>
                ))}
              </Select>
            </Field>
            {tablesFailed && (
              <p className="mt-2 text-sm text-[var(--ui-danger)]">
                {copy.tablesError}
              </p>
            )}
            <Button
              type="submit"
              className="mt-5"
              loading={busy}
              disabled={disabled}
            >
              {copy.createButton}
            </Button>
          </form>
        </Panel>
        <Panel>
          <form onSubmit={join} noValidate aria-label={copy.joinTitle}>
            <h2 className="mb-4 font-display text-2xl font-bold">
              {copy.joinTitle}
            </h2>
            <Field label={copy.joinCode}>
              <Input
                value={code}
                maxLength={6}
                autoCapitalize="characters"
                spellCheck={false}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
              />
            </Field>
            <Button
              type="submit"
              className="mt-5"
              variant="secondary"
              loading={busy}
              disabled={disabled}
            >
              {copy.joinButton}
            </Button>
          </form>
        </Panel>
      </div>
    </>
  );
}

function Table({
  copy,
  view,
  tables,
  participantId,
  busy,
  shared,
  navigate,
}: {
  copy: SharedOrderCopy;
  view: SharedOrderView;
  tables: TableOption[];
  participantId: string | null;
  busy: boolean;
  shared: ReturnType<typeof useSharedOrder>;
  navigate: NavigationHandlers["navigate"];
}) {
  const locale = useLocale();
  const money = formatMoney[locale];
  const menu = usePublicMenu();
  const [copied, setCopied] = useState(false);
  const open = view.status === "open";
  const tableName =
    tables.find((table) => table.id === view.tableId)?.tableNumber ??
    `#${view.tableId}`;

  async function copyLink() {
    const link = `${window.location.origin}/mesa?codigo=${view.code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      window.prompt(copy.copyLink, link);
    }
  }

  return (
    <>
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-400">
              {copy.tableNumber} {tableName}
            </p>
            <p className="font-display text-3xl font-bold tracking-widest">
              <span className="sr-only">{copy.code}: </span>
              {view.code}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => void copyLink()}>
              {copied ? copy.copied : copy.copyLink}
            </Button>
            <Button variant="secondary" onClick={() => void shared.leave()}>
              {copy.leave}
            </Button>
          </div>
        </div>
        <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-zinc-400">
          {copy.people}
        </h2>
        <ul className="mt-2 flex list-none flex-wrap gap-2 p-0">
          {view.participants.map((person) => (
            <li
              key={person.id}
              className="rounded-sm bg-zinc-900 px-3 py-1 text-sm"
              data-online={person.online}
            >
              <span
                aria-hidden="true"
                className={`mr-2 inline-block h-2 w-2 rounded-full ${
                  person.online ? "bg-green-400" : "bg-zinc-600"
                }`}
              />
              {person.name}
              {person.id === participantId ? " ★" : ""}
              <span className="sr-only">
                {" "}
                ({person.online ? copy.online : copy.offline})
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      {view.status === "submitted" && (
        <Panel>
          <p role="status" className="font-display text-2xl font-bold">
            {copy.sent}
          </p>
          {view.orderId !== null && (
            <p className="mt-2 text-zinc-300">
              {copy.sentDetail(view.orderId)}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={shared.startOver}>{copy.newTable}</Button>
            <a
              className="ui-button ui-button--secondary"
              href="/"
              onClick={(event) => navigate("/", event)}
            >
              {copy.backToStart}
            </a>
          </div>
        </Panel>
      )}

      <div className="grid gap-7 lg:grid-cols-[1.2fr_1fr]">
        <Panel>
          <h2 className="mb-4 font-display text-2xl font-bold">{copy.menu}</h2>
          {menu.loading ? (
            <p className="text-zinc-400">{copy.loadingMenu}</p>
          ) : (
            <div className="grid gap-6">
              {menu.sections.map((section) => {
                const dishes = section.items.filter(
                  (dish) => dish.id !== undefined && dish.available !== false,
                );
                if (dishes.length === 0) return null;
                return (
                  <section key={section.id ?? section.title}>
                    <h3 className="mb-2 text-lg font-bold text-[#e8b45f]">
                      {section.title}
                    </h3>
                    <ul className="m-0 grid list-none gap-2 p-0">
                      {dishes.map((dish) => (
                        <li
                          key={dish.id}
                          className="flex items-center justify-between gap-3 rounded-sm bg-zinc-900 px-3 py-2"
                        >
                          <span>
                            {dish.name}
                            <span className="ml-2 text-sm text-zinc-400">
                              {dish.price}
                            </span>
                          </span>
                          <Button
                            variant="secondary"
                            disabled={!open}
                            aria-label={`${copy.add}: ${dish.name}`}
                            onClick={() =>
                              void shared.addItem(dish.id as number)
                            }
                          >
                            {copy.add}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
              {menu.sections.every((section) =>
                section.items.every(
                  (dish) => dish.id === undefined || dish.available === false,
                ),
              ) && <p className="text-zinc-400">{copy.noDishes}</p>}
            </div>
          )}
        </Panel>

        <Panel>
          <h2 className="mb-4 font-display text-2xl font-bold">
            {copy.sharedOrder}
          </h2>
          {view.lines.length === 0 ? (
            <p className="text-zinc-400">{copy.emptyOrder}</p>
          ) : (
            <ul
              className="m-0 grid list-none gap-3 p-0"
              aria-live="polite"
              aria-label={copy.sharedOrder}
            >
              {view.lines.map((line) => (
                <LineRow
                  key={line.id}
                  copy={copy}
                  line={line}
                  money={money}
                  editable={open}
                  shared={shared}
                />
              ))}
            </ul>
          )}
          <p className="mt-5 flex items-baseline justify-between border-t border-zinc-700 pt-4 text-lg">
            <span>{copy.total}</span>
            <strong className="font-display text-2xl text-[#e8b45f]">
              {money(view.total)}
            </strong>
          </p>
          {view.status !== "submitted" && (
            <Button
              className="mt-5 w-full"
              loading={busy || view.status === "submitting"}
              disabled={!open || view.lines.length === 0}
              onClick={() => void shared.submit()}
            >
              {view.status === "submitting" ? copy.sending : copy.send}
            </Button>
          )}
        </Panel>
      </div>
    </>
  );
}

function LineRow({
  copy,
  line,
  money,
  editable,
  shared,
}: {
  copy: SharedOrderCopy;
  line: SharedOrderLine;
  money: (amount: number) => string;
  editable: boolean;
  shared: ReturnType<typeof useSharedOrder>;
}) {
  const [notes, setNotes] = useState(line.notes);
  const focused = useRef(false);

  // Show what someone else wrote, but never overwrite what this person is typing.
  useEffect(() => {
    if (!focused.current) setNotes(line.notes);
  }, [line.notes]);

  return (
    <li className="rounded-sm bg-zinc-900 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">{line.name}</p>
          <p className="text-sm text-zinc-400">
            {copy.addedBy} {line.addedByName}
          </p>
        </div>
        <p className="font-bold text-[#e8b45f]">
          {money(line.unitPrice * line.quantity)}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          disabled={!editable || line.quantity <= 1}
          aria-label={`${copy.decrease}: ${line.name}`}
          onClick={() => void shared.setQuantity(line.id, line.quantity - 1)}
        >
          −
        </Button>
        <output
          aria-label={copy.quantity(line.name)}
          className="min-w-8 text-center"
        >
          {line.quantity}
        </output>
        <Button
          variant="secondary"
          disabled={!editable}
          aria-label={`${copy.increase}: ${line.name}`}
          onClick={() => void shared.setQuantity(line.id, line.quantity + 1)}
        >
          +
        </Button>
        <Button
          variant="danger"
          disabled={!editable}
          aria-label={`${copy.remove}: ${line.name}`}
          onClick={() => void shared.removeLine(line.id)}
        >
          {copy.remove}
        </Button>
      </div>
      <div className="mt-3">
        <Input
          aria-label={copy.notesFor(line.name)}
          placeholder={copy.notes}
          value={notes}
          maxLength={MAX_NOTES_LENGTH}
          disabled={!editable}
          onFocus={() => (focused.current = true)}
          onChange={(event) => setNotes(event.target.value)}
          onBlur={() => {
            focused.current = false;
            if (notes.trim() !== line.notes) {
              void shared.setNotes(line.id, notes.trim());
            }
          }}
        />
      </div>
    </li>
  );
}
