import type { ReactNode } from "react";
import { T, t } from "../../i18n";
import type { FormEvent } from "react";

import type { RecipeSupply } from "../../data/menu";
import type { EditableDish } from "../../menuStore";
import {
  countExistingSelectedDishes,
  getEditableDishKey,
  getMenuForEditing,
  isFeaturedDish,
  isGalleryDish,
} from "../../menuStore";
import { ORDER_STATUS_LABELS, ORDER_STATUSES } from "../../mocks/employeePanel";
import type {
  ChatMessage,
  EmployeeRecord,
  EmployeeSession,
  OrderRecord,
  SupplyRecord,
} from "../../mocks/employeePanel";
import {
  getDishRecipe,
  getDishRecipeSupplies,
  getOrderDishes,
  getOrderLines,
  normalizeOrderStatus,
} from "./helpers";
import {
  Checkbox,
  DeleteButton,
  Field,
  getInputClassName,
  inputClassName,
  Metric,
  Panel,
  StatusPill,
} from "./shared";
export function ChatManagement({
  connection,
  employees,
  messages,
  onSelectEmployee,
  onSend,
  selectedEmployeeId,
  session,
}: {
  connection?: {
    senderId: number;
    header: ReactNode;
    connected: boolean;
    loading: boolean;
    sending: boolean;
    error: string;
    text: string;
    setText: (text: string) => void;
  };
  employees: EmployeeRecord[];
  messages: ChatMessage[];
  onSelectEmployee: (employeeId: number) => void;
  onSend: (
    event: FormEvent<HTMLFormElement>,
    recipient: EmployeeRecord,
  ) => void;
  selectedEmployeeId: number;
  session: EmployeeSession;
}) {
  const availableEmployees = employees.filter(
    (employee) =>
      employee.active &&
      (connection
        ? Boolean(employee.userId) && employee.userId !== connection.senderId
        : employee.name !== session.name),
  );
  const selectedEmployee =
    availableEmployees.find((employee) => employee.id === selectedEmployeeId) ??
    availableEmployees[0];
  const conversationMessages = selectedEmployee
    ? messages.filter((message) =>
        connection
          ? (message.senderId === connection.senderId &&
              message.receiverId === selectedEmployee.userId) ||
            (message.receiverId === connection.senderId &&
              message.senderId === selectedEmployee.userId)
          : (message.author === session.name &&
              message.recipient === selectedEmployee.name) ||
            (message.author === selectedEmployee.name &&
              (!message.recipient || message.recipient === session.name)),
      )
    : [];

  return (
    <Panel className="mt-6">
      <div>
        <h3 className="font-display text-3xl font-bold">
          <T>Chat interno</T>
        </h3>
        <p className="mt-3 text-sm leading-7 text-zinc-400">
          <T>Conversaciones directas entre empleados del restaurante.</T>
        </p>
      </div>

      {connection?.header}
      {connection?.error && (
        <p role="alert" className="mt-4 text-red-200">
          {connection.error}
        </p>
      )}
      <div className="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="grid max-h-[620px] gap-3 overflow-auto rounded-sm border border-white/10 bg-zinc-950/45 p-3">
          {availableEmployees.map((employee) => (
            <button
              className={`rounded-sm border p-4 text-left transition ${
                selectedEmployee?.id === employee.id
                  ? "border-[#e8b45f] bg-[#333333]"
                  : "border-white/10 bg-black/20 hover:border-[#e8b45f]"
              }`}
              key={employee.id}
              onClick={() => onSelectEmployee(employee.id)}
              type="button"
            >
              <p className="font-bold text-white">{employee.name}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#e8b45f]">
                {employee.position} ·{" "}
                {connection ? employee.roleName : employee.role}
              </p>
            </button>
          ))}
        </div>

        <div>
          <div className="rounded-sm border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e8b45f]">
              <T>Conversacion</T>
            </p>
            <h4 className="mt-2 font-display text-3xl font-bold">
              {selectedEmployee?.name ?? "Sin empleados disponibles"}
            </h4>
          </div>

          <div className="mt-4 grid max-h-[520px] min-h-[360px] gap-4 overflow-auto rounded-sm border border-white/10 bg-zinc-950/55 p-4">
            {conversationMessages.length > 0 ? (
              conversationMessages.map((message) => {
                const isOwnMessage = connection
                  ? message.senderId === connection.senderId
                  : message.author === session.name;

                return (
                  <article
                    className={`max-w-[88%] rounded-sm border p-4 ${
                      isOwnMessage
                        ? "ml-auto border-[#e8b45f]/70 bg-[#333333]"
                        : "border-white/10 bg-black/30"
                    }`}
                    key={message.id}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-bold text-white">{message.author}</p>
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#e8b45f]">
                        {connection ? message.roleName : message.role}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {message.time}
                      </span>
                    </div>
                    <p className="mt-3 leading-7 text-zinc-200">
                      {message.text}
                    </p>
                  </article>
                );
              })
            ) : (
              <p className="self-center text-center text-zinc-400">
                <T>No hay mensajes con esta persona.</T>
              </p>
            )}
          </div>

          {selectedEmployee ? (
            <form
              className="mt-5 flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => onSend(event, selectedEmployee)}
            >
              <input
                className="min-h-12 flex-1 rounded-sm border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-[#e8b45f]"
                name="message"
                aria-label={t("Mensaje")}
                required
                maxLength={connection ? 5000 : undefined}
                disabled={
                  connection &&
                  (!connection.connected ||
                    connection.loading ||
                    connection.sending)
                }
                value={connection?.text}
                onChange={
                  connection
                    ? (event) => connection.setText(event.target.value)
                    : undefined
                }
                placeholder={`Mensaje para ${selectedEmployee.name}`}
              />
              <button
                className="rounded-sm bg-[#e8b45f] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-zinc-950 transition hover:bg-white"
                disabled={
                  connection &&
                  (!connection.connected ||
                    connection.loading ||
                    connection.sending ||
                    !connection.text.trim())
                }
                type="submit"
              >
                <T>Enviar</T>
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}
