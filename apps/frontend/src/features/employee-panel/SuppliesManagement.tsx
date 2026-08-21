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
export function SuppliesManagement({
  addLabel,
  canEdit,
  description,
  emptyReadOnlyMessage,
  itemNameLabel,
  items,
  onAdd,
  onDelete,
  onUpdate,
  title,
}: {
  addLabel: string;
  canEdit: boolean;
  description: string;
  emptyReadOnlyMessage: string;
  itemNameLabel: string;
  items: SupplyRecord[];
  onAdd: () => void;
  onDelete: (supplyId: number) => void;
  onUpdate: (
    supplyId: number,
    field: keyof SupplyRecord,
    value: string,
  ) => void;
  title: string;
}) {
  return (
    <Panel className="mt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-3xl font-bold">{title}</h3>
          <p className="mt-3 text-sm leading-7 text-zinc-400">{description}</p>
        </div>
        {canEdit ? (
          <button
            className="rounded-sm bg-[#e8b45f] px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-zinc-950 transition hover:bg-white"
            onClick={onAdd}
            type="button"
          >
            {addLabel}
          </button>
        ) : null}
      </div>

      {!canEdit ? (
        <p className="mt-5 rounded-sm border border-white/10 bg-black/25 p-4 text-sm text-zinc-300">
          {emptyReadOnlyMessage}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4">
        {items.map((supply) => (
          <div
            className={`grid gap-4 rounded-sm border border-white/10 bg-zinc-950/60 p-4 ${
              canEdit
                ? "lg:grid-cols-[1.2fr_0.55fr_0.65fr_0.8fr_0.65fr_auto]"
                : "lg:grid-cols-[1.2fr_0.55fr_0.65fr_0.8fr_0.65fr]"
            }`}
            key={supply.id}
          >
            <Field label={itemNameLabel}>
              <input
                className={getInputClassName(canEdit)}
                onChange={(event) =>
                  onUpdate(supply.id, "name", event.target.value)
                }
                readOnly={!canEdit}
                value={supply.name}
              />
            </Field>
            <Field label="Unidad">
              <input
                className={getInputClassName(canEdit)}
                onChange={(event) =>
                  onUpdate(supply.id, "unit", event.target.value)
                }
                readOnly={!canEdit}
                value={supply.unit}
              />
            </Field>
            <Field label="Stock">
              <input
                className={getInputClassName(canEdit)}
                onChange={(event) =>
                  onUpdate(supply.id, "stock", event.target.value)
                }
                readOnly={!canEdit}
                value={supply.stock}
              />
            </Field>
            <Field label="Costo">
              <input
                className={getInputClassName(canEdit)}
                onChange={(event) =>
                  onUpdate(supply.id, "cost", event.target.value)
                }
                readOnly={!canEdit}
                value={supply.cost}
              />
            </Field>
            <Field label="Minimo">
              <input
                className={getInputClassName(canEdit)}
                onChange={(event) =>
                  onUpdate(supply.id, "threshold", event.target.value)
                }
                readOnly={!canEdit}
                value={supply.threshold}
              />
            </Field>
            {canEdit ? (
              <div className="flex items-end justify-end pb-2">
                <DeleteButton
                  label={`Eliminar ${supply.name}`}
                  onClick={() => onDelete(supply.id)}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Panel>
  );
}
