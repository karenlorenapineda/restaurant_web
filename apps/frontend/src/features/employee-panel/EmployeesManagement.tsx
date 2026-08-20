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
export function EmployeesManagement({
  employees,
  isAdmin,
  onAdd,
  onDelete,
  onUpdate,
}: {
  employees: EmployeeRecord[];
  isAdmin: boolean;
  onAdd: () => void;
  onDelete: (employeeId: number) => void;
  onUpdate: (
    employeeId: number,
    field: keyof EmployeeRecord,
    value: string | boolean,
  ) => void;
}) {
  return (
    <Panel className="mt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-3xl font-bold">
            Gestion de empleados
          </h3>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Los roles siguen la idea de RolesUsuario y Empleados de la base de
            datos. Solo admin puede cambiarlos.
          </p>
        </div>
        <button
          className="rounded-sm bg-[#e8b45f] px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-zinc-950 transition hover:bg-white"
          onClick={onAdd}
          type="button"
        >
          Anadir empleado
        </button>
      </div>

      {!isAdmin ? (
        <p className="mt-5 rounded-sm border border-[#e8b45f]/60 bg-black/25 p-4 text-sm text-zinc-300">
          Has entrado con rol empleado. Puedes consultar el equipo, pero el
          cambio de roles queda reservado a administracion.
        </p>
      ) : null}

      <div className="mt-6 grid gap-4">
        {employees.map((employee) => (
          <div
            className="grid gap-4 rounded-sm border border-white/10 bg-zinc-950/60 p-4 lg:grid-cols-[1.1fr_1fr_0.85fr_0.7fr_0.6fr_auto]"
            key={employee.id}
          >
            <Field label="Nombre">
              <input
                className={inputClassName}
                onChange={(event) =>
                  onUpdate(employee.id, "name", event.target.value)
                }
                value={employee.name}
              />
            </Field>
            <Field label="Email">
              <input
                className={inputClassName}
                onChange={(event) =>
                  onUpdate(employee.id, "email", event.target.value)
                }
                type="email"
                value={employee.email}
              />
            </Field>
            <Field label="Cargo">
              <input
                className={inputClassName}
                onChange={(event) =>
                  onUpdate(employee.id, "position", event.target.value)
                }
                value={employee.position}
              />
            </Field>
            <Field label="Rol">
              <select
                className={`${inputClassName} disabled:cursor-not-allowed disabled:opacity-55`}
                disabled={!isAdmin}
                onChange={(event) =>
                  onUpdate(employee.id, "role", event.target.value)
                }
                value={employee.role}
              >
                <option value="admin">admin</option>
                <option value="empleado">empleado</option>
                <option value="cocina">cocina</option>
              </select>
            </Field>
            <label className="flex items-end gap-3 pb-3 text-sm font-semibold text-zinc-200">
              <input
                checked={employee.active}
                className="h-5 w-5 accent-[#e8b45f]"
                onChange={(event) =>
                  onUpdate(employee.id, "active", event.target.checked)
                }
                type="checkbox"
              />
              Activo
            </label>
            <div className="flex items-end justify-end pb-2">
              <DeleteButton
                label={`Eliminar ${employee.name}`}
                onClick={() => onDelete(employee.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
