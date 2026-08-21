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
export function OrdersManagement({
  canEdit,
  canViewRecipe,
  dishes,
  onAdd,
  onCancelPending,
  onConfirmPending,
  onDelete,
  onSelect,
  onTogglePendingRemovedIngredient,
  onToggleRemovedIngredient,
  onUpdate,
  onUpdateDishQuantity,
  onUpdatePending,
  onUpdatePendingDishQuantity,
  orders,
  pendingOrder,
  selectedOrderId,
}: {
  canEdit: boolean;
  canViewRecipe: boolean;
  dishes: EditableDish[];
  onAdd: () => void;
  onCancelPending: () => void;
  onConfirmPending: () => void;
  onDelete: (orderId: number) => void;
  onSelect: (orderId: number) => void;
  onTogglePendingRemovedIngredient: (
    dish: EditableDish,
    ingredient: string,
    checked: boolean,
  ) => void;
  onToggleRemovedIngredient: (
    orderId: number,
    dish: EditableDish,
    ingredient: string,
    checked: boolean,
  ) => void;
  onUpdate: (orderId: number, field: keyof OrderRecord, value: string) => void;
  onUpdateDishQuantity: (
    orderId: number,
    dish: EditableDish,
    quantity: number,
  ) => void;
  onUpdatePending: (field: keyof OrderRecord, value: string) => void;
  onUpdatePendingDishQuantity: (dish: EditableDish, quantity: number) => void;
  orders: OrderRecord[];
  pendingOrder: OrderRecord | null;
  selectedOrderId: number | null;
}) {
  const isPendingOrder = Boolean(pendingOrder);
  const selectedOrder =
    pendingOrder ??
    orders.find((order) => order.id === selectedOrderId) ??
    orders[0] ??
    null;
  const selectedOrderDishes = selectedOrder
    ? getOrderDishes(selectedOrder, dishes)
    : [];

  return (
    <Panel className="mt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-3xl font-bold">Pedidos</h3>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Tablero visual basado en pedidos: cola, preparacion y terminado.
          </p>
        </div>
        {canEdit ? (
          <button
            className="rounded-sm bg-[#e8b45f] px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPendingOrder}
            onClick={onAdd}
            type="button"
          >
            {isPendingOrder ? "Pedido pendiente" : "Anadir pedido"}
          </button>
        ) : null}
      </div>

      {!canEdit ? (
        <p className="mt-5 rounded-sm border border-white/10 bg-black/25 p-4 text-sm text-zinc-300">
          Cocina puede ver pedidos y cambiarlos de estado, pero crear pedidos
          queda para sala y administracion.
        </p>
      ) : null}

      {isPendingOrder ? (
        <p className="mt-5 rounded-sm border border-[#e8b45f]/60 bg-black/25 p-4 text-sm font-semibold text-zinc-200">
          Pedido sin confirmar: puedes revisarlo y cambiar platos/opciones. Los
          insumos se descontaran solo al confirmar.
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {ORDER_STATUSES.map((status) => {
          const statusOrders = orders.filter(
            (order) => normalizeOrderStatus(order.status) === status,
          );

          return (
            <div
              className="min-h-[360px] rounded-sm border border-white/10 bg-zinc-950/45 p-4"
              key={status}
            >
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-display text-2xl font-bold">
                  {ORDER_STATUS_LABELS[status]}
                </h4>
                <span className="rounded-sm bg-black/35 px-3 py-1 text-xs font-bold text-[#e8b45f]">
                  {statusOrders.length}
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {statusOrders.map((order) => (
                  <button
                    className={`rounded-sm border p-4 text-left transition ${
                      selectedOrder?.id === order.id
                        ? "border-[#e8b45f] bg-[#333333]"
                        : "border-white/10 bg-black/30 hover:border-[#e8b45f]"
                    }`}
                    key={order.id}
                    onClick={() => onSelect(order.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-white">{order.table}</p>
                        <p className="mt-1 text-sm text-zinc-400">
                          {order.customer}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-[#e8b45f]">
                        {order.total}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-zinc-300">
                      {order.items}
                    </p>
                    {order.notes ? (
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#e8b45f]">
                        {order.notes}
                      </p>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedOrder ? (
        <div className="mt-6 rounded-sm border border-[#e8b45f]/50 bg-black/25 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h4 className="font-display text-3xl font-bold">
                {selectedOrder.table} · {selectedOrder.customer}
              </h4>
              <p className="mt-3 max-w-3xl leading-7 text-zinc-300">
                {selectedOrder.items || "Selecciona platos para este pedido."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                className="rounded-sm border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-white outline-none transition focus:border-[#e8b45f]"
                onChange={(event) =>
                  isPendingOrder
                    ? onUpdatePending("status", event.target.value)
                    : onUpdate(selectedOrder.id, "status", event.target.value)
                }
                value={normalizeOrderStatus(selectedOrder.status)}
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {ORDER_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              {isPendingOrder ? (
                <>
                  <button
                    className="rounded-sm bg-[#e8b45f] px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-zinc-950 transition hover:bg-white"
                    onClick={onConfirmPending}
                    type="button"
                  >
                    Confirmar pedido
                  </button>
                  <button
                    className="rounded-sm border border-zinc-700 px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-zinc-300 transition hover:border-[#e8b45f] hover:text-white"
                    onClick={onCancelPending}
                    type="button"
                  >
                    Cancelar
                  </button>
                </>
              ) : canEdit ? (
                <DeleteButton
                  label={`Eliminar pedido ${selectedOrder.table}`}
                  onClick={() => onDelete(selectedOrder.id)}
                />
              ) : null}
            </div>
          </div>

          {canEdit ? (
            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <Field label="Mesa">
                <input
                  className={inputClassName}
                  onChange={(event) =>
                    isPendingOrder
                      ? onUpdatePending("table", event.target.value)
                      : onUpdate(selectedOrder.id, "table", event.target.value)
                  }
                  value={selectedOrder.table}
                />
              </Field>
              <Field label="Cliente">
                <input
                  className={inputClassName}
                  onChange={(event) =>
                    isPendingOrder
                      ? onUpdatePending("customer", event.target.value)
                      : onUpdate(
                          selectedOrder.id,
                          "customer",
                          event.target.value,
                        )
                  }
                  value={selectedOrder.customer}
                />
              </Field>
              <Field label="Total">
                <input
                  className={inputClassName}
                  onChange={(event) =>
                    isPendingOrder
                      ? onUpdatePending("total", event.target.value)
                      : onUpdate(selectedOrder.id, "total", event.target.value)
                  }
                  value={selectedOrder.total}
                />
              </Field>
              <Field label="Notas">
                <input
                  className={inputClassName}
                  onChange={(event) =>
                    isPendingOrder
                      ? onUpdatePending("notes", event.target.value)
                      : onUpdate(selectedOrder.id, "notes", event.target.value)
                  }
                  value={selectedOrder.notes}
                />
              </Field>
            </div>
          ) : null}

          {canEdit ? (
            <div className="mt-6">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#e8b45f]">
                Platos del pedido
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {dishes
                  .filter((dish) => dish.available)
                  .map((dish) => {
                    const dishKey = getEditableDishKey(dish);
                    const orderLine = getOrderLines(selectedOrder, dishes).find(
                      (currentOrderLine) =>
                        currentOrderLine.dishKey === dishKey,
                    );

                    return (
                      <div
                        className="grid gap-3 rounded-sm border border-white/10 bg-zinc-950/60 p-3 text-sm font-semibold text-zinc-200 sm:grid-cols-[1fr_90px]"
                        key={dishKey}
                      >
                        <span>{dish.name}</span>
                        <input
                          className="w-full rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none transition focus:border-[#e8b45f]"
                          min="0"
                          onChange={(event) =>
                            isPendingOrder
                              ? onUpdatePendingDishQuantity(
                                  dish,
                                  Number(event.target.value),
                                )
                              : onUpdateDishQuantity(
                                  selectedOrder.id,
                                  dish,
                                  Number(event.target.value),
                                )
                          }
                          type="number"
                          value={orderLine?.quantity ?? 0}
                        />
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {selectedOrderDishes.map((dish) => {
              const dishKey = getEditableDishKey(dish);
              const orderLine = getOrderLines(selectedOrder, dishes).find(
                (currentOrderLine) => currentOrderLine.dishKey === dishKey,
              );
              const removedIngredients =
                selectedOrder.removedIngredientsByDish?.[dishKey] ?? [];
              const recipeSupplies = getDishRecipeSupplies(dish);

              return (
                <article
                  className="rounded-sm border border-white/10 bg-zinc-950/55 p-4"
                  key={dishKey}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h5 className="font-display text-2xl font-bold">
                        {dish.name}
                      </h5>
                      <p className="mt-2 text-sm font-bold text-[#e8b45f]">
                        {orderLine?.quantity ?? 1}x · {dish.price}
                      </p>
                    </div>
                    {removedIngredients.length > 0 ? (
                      <span className="rounded-sm border border-[#e8b45f]/60 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#e8b45f]">
                        Con cambios
                      </span>
                    ) : null}
                  </div>

                  {canViewRecipe ? (
                    <div className="mt-4 rounded-sm border border-white/10 bg-black/25 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e8b45f]">
                        Receta cocina
                      </p>
                      <p className="mt-2 leading-7 text-zinc-300">
                        {getDishRecipe(dish)}
                      </p>
                    </div>
                  ) : null}

                  {recipeSupplies.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e8b45f]">
                        Insumos y opciones
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {recipeSupplies.map((recipeSupply) => {
                          const ingredient = recipeSupply.supplyName;
                          const isRemoved =
                            removedIngredients.includes(ingredient);

                          return (
                            <label
                              className={`flex items-center gap-3 rounded-sm border p-3 text-sm font-semibold ${
                                isRemoved
                                  ? "border-[#e8b45f] bg-[#333333] text-white"
                                  : "border-white/10 bg-black/20 text-zinc-300"
                              }`}
                              key={`${ingredient}-${recipeSupply.quantity}-${recipeSupply.unit}`}
                            >
                              <input
                                checked={isRemoved}
                                className="h-5 w-5 accent-[#e8b45f]"
                                disabled={!canEdit}
                                onChange={(event) =>
                                  isPendingOrder
                                    ? onTogglePendingRemovedIngredient(
                                        dish,
                                        ingredient,
                                        event.target.checked,
                                      )
                                    : onToggleRemovedIngredient(
                                        selectedOrder.id,
                                        dish,
                                        ingredient,
                                        event.target.checked,
                                      )
                                }
                                type="checkbox"
                              />
                              Sin {ingredient}
                              <span className="ml-auto text-xs text-zinc-500">
                                {recipeSupply.quantity} {recipeSupply.unit}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-6 rounded-sm border border-white/10 bg-black/25 p-5 text-zinc-300">
          No hay pedidos creados.
        </p>
      )}
    </Panel>
  );
}
