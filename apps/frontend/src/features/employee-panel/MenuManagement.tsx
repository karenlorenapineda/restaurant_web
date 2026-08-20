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
export function MenuManagement({
  canEdit,
  deleteDish,
  dishes,
  draft,
  featuredKeys,
  galleryKeys,
  isCreatingDish,
  saveDish,
  saveMessage,
  sections,
  selectedDishKey,
  selectDish,
  startNewDish,
  supplies,
  toggleFeaturedDish,
  toggleGalleryDish,
  updateDraft,
}: {
  canEdit: boolean;
  deleteDish: (dish: EditableDish) => void;
  dishes: EditableDish[];
  draft: EditableDish | null;
  featuredKeys: string[];
  galleryKeys: string[];
  isCreatingDish: boolean;
  saveDish: () => void;
  saveMessage: string;
  sections: ReturnType<typeof getMenuForEditing>;
  selectedDishKey: string;
  selectDish: (dish: EditableDish) => void;
  startNewDish: () => void;
  supplies: SupplyRecord[];
  toggleFeaturedDish: (isFeatured: boolean) => void;
  toggleGalleryDish: (isGallery: boolean) => void;
  updateDraft: (
    field: keyof EditableDish,
    value: string | boolean | string[] | RecipeSupply[],
  ) => void;
}) {
  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Platos" value={String(dishes.length)} />
        <Metric
          label="Disponibles"
          value={String(dishes.filter((dish) => dish.available).length)}
        />
        <Metric
          label="Favoritos"
          value={String(countExistingSelectedDishes(featuredKeys, dishes))}
        />
        <Metric
          label="Galeria"
          value={String(countExistingSelectedDishes(galleryKeys, dishes))}
        />
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-display text-3xl font-bold">Platos</h3>
            {canEdit ? (
              <button
                className="rounded-sm bg-[#e8b45f] px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-zinc-950 transition hover:bg-white"
                onClick={startNewDish}
                type="button"
              >
                Anadir plato
              </button>
            ) : null}
          </div>
          <div className="mt-5 grid gap-3">
            {dishes.map((dish) => (
              <div
                className={`rounded-sm border p-4 text-left transition ${
                  getEditableDishKey(dish) === selectedDishKey &&
                  !isCreatingDish
                    ? "border-[#e8b45f] bg-[#333333]"
                    : "border-white/10 bg-zinc-950/75 hover:border-[#e8b45f]"
                }`}
                key={`${dish.categoryTitle}-${getEditableDishKey(dish)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => selectDish(dish)}
                    type="button"
                  >
                    <p className="font-bold text-zinc-100">{dish.name}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#e8b45f]">
                      {dish.categoryTitle}
                      {isFeaturedDish(dish, featuredKeys) ? " / Favorito" : ""}
                      {isGalleryDish(dish, galleryKeys) ? " / Galeria" : ""}
                    </p>
                  </button>
                  <span className="text-sm font-bold text-[#e8b45f]">
                    {dish.price}
                  </span>
                  {canEdit ? (
                    <DeleteButton
                      label={`Eliminar ${dish.name}`}
                      onClick={() => deleteDish(dish)}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <h3 className="font-display text-3xl font-bold">
            {canEdit
              ? isCreatingDish
                ? "Nuevo plato"
                : "Editar plato"
              : "Detalle del plato"}
          </h3>
          {!canEdit ? (
            <p className="mt-4 rounded-sm border border-white/10 bg-black/25 p-4 text-sm text-zinc-300">
              Vista para cocina: puedes revisar platos, categorias,
              disponibilidad y descripcion, pero la edicion queda para
              administracion.
            </p>
          ) : null}
          {draft ? (
            <form className="mt-6 grid gap-5">
              <Field label="Nombre">
                <input
                  className={getInputClassName(canEdit)}
                  onChange={(event) => updateDraft("name", event.target.value)}
                  readOnly={!canEdit}
                  type="text"
                  value={draft.name}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Categoria">
                  <select
                    className={getInputClassName(canEdit)}
                    disabled={!canEdit}
                    onChange={(event) =>
                      updateDraft("categoryTitle", event.target.value)
                    }
                    value={draft.categoryTitle}
                  >
                    {sections.map((section) => (
                      <option key={section.title}>{section.title}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Precio">
                  <input
                    className={getInputClassName(canEdit)}
                    onChange={(event) =>
                      updateDraft("price", event.target.value)
                    }
                    readOnly={!canEdit}
                    type="text"
                    value={draft.price}
                  />
                </Field>
              </div>

              <Field label="Imagen">
                <input
                  className={getInputClassName(canEdit)}
                  onChange={(event) => updateDraft("image", event.target.value)}
                  placeholder="/images/bandeja-paisa.jpg"
                  readOnly={!canEdit}
                  type="text"
                  value={draft.image ?? ""}
                />
              </Field>

              <Field label="Descripcion">
                <textarea
                  className={`${getInputClassName(canEdit)} min-h-36`}
                  onChange={(event) =>
                    updateDraft("description", event.target.value)
                  }
                  readOnly={!canEdit}
                  value={draft.description}
                />
              </Field>

              <Field label="Receta interna">
                <textarea
                  className={`${getInputClassName(canEdit)} min-h-36`}
                  onChange={(event) =>
                    updateDraft("recipe", event.target.value)
                  }
                  readOnly={!canEdit}
                  value={getDishRecipe(draft)}
                />
              </Field>

              <RecipeSuppliesEditor
                canEdit={canEdit}
                onChange={(recipeSupplies) =>
                  updateDraft("recipeSupplies", recipeSupplies)
                }
                recipeSupplies={getDishRecipeSupplies(draft)}
                supplies={supplies}
              />

              {canEdit ? (
                <>
                  <Checkbox
                    checked={draft.available}
                    label="Disponible en la carta"
                    onChange={(checked) => updateDraft("available", checked)}
                  />
                  <Checkbox
                    checked={isFeaturedDish(draft, featuredKeys)}
                    label="Mostrar como favorito en la pagina principal"
                    onChange={toggleFeaturedDish}
                  />
                  <Checkbox
                    checked={isGalleryDish(draft, galleryKeys)}
                    label="Mostrar imagen del plato en la galeria"
                    onChange={toggleGalleryDish}
                  />
                </>
              ) : (
                <div className="grid gap-3 text-sm font-semibold text-zinc-300 sm:grid-cols-3">
                  <StatusPill
                    label={draft.available ? "Disponible" : "No disponible"}
                  />
                  <StatusPill
                    label={
                      isFeaturedDish(draft, featuredKeys)
                        ? "Favorito"
                        : "No favorito"
                    }
                  />
                  <StatusPill
                    label={
                      isGalleryDish(draft, galleryKeys)
                        ? "En galeria"
                        : "Fuera de galeria"
                    }
                  />
                </div>
              )}

              {saveMessage ? (
                <p className="text-sm font-semibold text-[#e8b45f]">
                  {saveMessage}
                </p>
              ) : null}

              {canEdit ? (
                <button
                  className="rounded-sm bg-[#e8b45f] px-5 py-4 font-bold uppercase tracking-[0.12em] text-zinc-950 transition hover:bg-white"
                  onClick={saveDish}
                  type="button"
                >
                  Guardar cambios
                </button>
              ) : null}
            </form>
          ) : (
            <p className="mt-6 text-zinc-400">No hay platos para editar.</p>
          )}
        </Panel>
      </div>
    </>
  );
}

function RecipeSuppliesEditor({
  canEdit,
  onChange,
  recipeSupplies,
  supplies,
}: {
  canEdit: boolean;
  onChange: (recipeSupplies: RecipeSupply[]) => void;
  recipeSupplies: RecipeSupply[];
  supplies: SupplyRecord[];
}) {
  const firstSupply = supplies[0];

  function updateRecipeSupply(
    index: number,
    field: keyof RecipeSupply,
    value: string,
  ) {
    onChange(
      recipeSupplies.map((recipeSupply, currentIndex) =>
        currentIndex === index
          ? { ...recipeSupply, [field]: value }
          : recipeSupply,
      ),
    );
  }

  function addRecipeSupply() {
    onChange([
      ...recipeSupplies,
      {
        quantity: "1",
        supplyName: firstSupply?.name ?? "Nuevo insumo",
        unit: firstSupply?.unit ?? "und",
      },
    ]);
  }

  function removeRecipeSupply(index: number) {
    onChange(
      recipeSupplies.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-zinc-200">
          Insumos de la receta
        </p>
        {canEdit ? (
          <button
            className="rounded-sm border border-[#e8b45f] px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#e8b45f] transition hover:bg-[#e8b45f] hover:text-zinc-950"
            onClick={addRecipeSupply}
            type="button"
          >
            Anadir insumo
          </button>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3">
        {recipeSupplies.length > 0 ? (
          recipeSupplies.map((recipeSupply, index) => (
            <div
              className={`grid gap-3 rounded-sm border border-white/10 bg-zinc-950/60 p-3 ${
                canEdit
                  ? "md:grid-cols-[1fr_0.45fr_0.45fr_auto]"
                  : "md:grid-cols-[1fr_0.45fr_0.45fr]"
              }`}
              key={`${recipeSupply.supplyName}-${index}`}
            >
              <select
                className={getInputClassName(canEdit)}
                disabled={!canEdit}
                onChange={(event) => {
                  const selectedSupply = supplies.find(
                    (supply) => supply.name === event.target.value,
                  );

                  onChange(
                    recipeSupplies.map((recipeSupplyItem, currentIndex) =>
                      currentIndex === index
                        ? {
                            ...recipeSupplyItem,
                            supplyName: event.target.value,
                            unit: selectedSupply?.unit ?? recipeSupplyItem.unit,
                          }
                        : recipeSupplyItem,
                    ),
                  );
                }}
                value={recipeSupply.supplyName}
              >
                {supplies.map((supply) => (
                  <option key={supply.id} value={supply.name}>
                    {supply.name}
                  </option>
                ))}
                {!supplies.some(
                  (supply) => supply.name === recipeSupply.supplyName,
                ) ? (
                  <option value={recipeSupply.supplyName}>
                    {recipeSupply.supplyName}
                  </option>
                ) : null}
              </select>
              <input
                className={getInputClassName(canEdit)}
                onChange={(event) =>
                  updateRecipeSupply(index, "quantity", event.target.value)
                }
                readOnly={!canEdit}
                value={recipeSupply.quantity}
              />
              <input
                className={getInputClassName(canEdit)}
                onChange={(event) =>
                  updateRecipeSupply(index, "unit", event.target.value)
                }
                readOnly={!canEdit}
                value={recipeSupply.unit}
              />
              {canEdit ? (
                <div className="flex items-end justify-end pb-2">
                  <DeleteButton
                    label={`Quitar ${recipeSupply.supplyName}`}
                    onClick={() => removeRecipeSupply(index)}
                  />
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <p className="rounded-sm border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
            No hay insumos asignados a esta receta.
          </p>
        )}
      </div>
    </div>
  );
}
