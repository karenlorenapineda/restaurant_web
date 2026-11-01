import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { errorMessage, parseCop, request } from "../../api/client";
import { emptyPanelData, fetchPanelData } from "../../api/employeePanel";
import type { PanelData } from "../../api/employeePanel";
import { createOrder, transitions, updateOrderStatus } from "../../api/orders";
import type { ApiOrderStatus, CreateOrder } from "../../api/orders";
import type { EditableDish } from "../../menuStore";
import { flattenMenu, getEditableDishKey } from "../../menuStore";
import type { RecipeSupply } from "../../data/menu";
import type {
  DashboardTab,
  EmployeeRecord,
  EmployeeSession,
  OrderRecord,
  SupplyRecord,
} from "../../mocks/employeePanel";
import { useIntegrationCopy } from "../../integrationCopy";

const amount = (value: string) => {
  const number = Number(value.replace(",", "."));
  if (!value.trim() || !Number.isFinite(number) || number < 0)
    throw new Error("Invalid quantity");
  return number;
};
const price = (value: string) =>
  /COP|\$/.test(value) ? parseCop(value) : amount(value);
const positive = (value: unknown) =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

export function useConnectedPanel() {
  const labels = useIntegrationCopy();
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("menu");
  const [data, setData] = useState<PanelData>(emptyPanelData);
  const [supplies, setSupplies] = useState<SupplyRecord[]>([]);
  const [inventory, setInventory] = useState<SupplyRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const nextDraftId = useRef(-Date.now());
  const pendingStock = useRef(new Set<number>());
  const pendingInventory = useRef(new Set<number>());
  const pendingEmployees = useRef(new Set<number>());
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [selectedDishKey, setSelectedDishKey] = useState("");
  const [draft, setDraft] = useState<EditableDish | null>(null);
  const [isCreatingDish, setIsCreatingDish] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [pendingOrder, setPendingOrder] = useState<OrderRecord | null>(null);
  const draftDirty = useRef(false);
  const [galleryKeys, setGalleryKeys] = useState<string[]>([]);
  const sections = data.sections;
  const dishes = useMemo(() => flattenMenu(sections), [sections]);
  const orders = data.orders;
  const isAdmin = session?.role === "admin";
  const canViewMenu = isAdmin || session?.role === "cocina";
  const canAddOrders = isAdmin || session?.role === "empleado";

  const load = useCallback(async (signal?: AbortSignal) => {
    const next = await fetchPanelData(signal);
    if (signal?.aborted) return;
    setData(next);
    const preserve = <T extends { id: number }>(
      server: T[],
      current: T[],
      dirty: Set<number>,
    ) => [
      ...server.map((row) =>
        dirty.has(row.id)
          ? (current.find((item) => item.id === row.id) ?? row)
          : row,
      ),
      ...current.filter((row) => row.id < 0 && dirty.has(row.id)),
    ];
    setSupplies((current) =>
      preserve(next.supplies, current, pendingStock.current),
    );
    setInventory((current) =>
      preserve(next.inventory, current, pendingInventory.current),
    );
    setEmployees((current) =>
      preserve(next.employees, current, pendingEmployees.current),
    );
    const flat = flattenMenu(next.sections);
    setSelectedDishKey((current) =>
      flat.some((item) => getEditableDishKey(item) === current)
        ? current
        : flat[0]
          ? getEditableDishKey(flat[0])
          : "",
    );
    if (!draftDirty.current) {
      setDraft(
        (current) =>
          flat.find((item) => item.id === current?.id) ?? flat[0] ?? null,
      );
      setGalleryKeys(
        flat.filter((item) => item.showImage).map(getEditableDishKey),
      );
    }
  }, []);
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    load(controller.signal)
      .catch((error) => {
        if (!controller.signal.aborted) setError(errorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [Boolean(session), load]);

  async function mutate(
    action: () => Promise<unknown>,
    onSuccess?: () => void,
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setSaveMessage("");
    try {
      await action();
      onSuccess?.();
      setSaveMessage(labels.done);
      try {
        await load();
      } catch (error) {
        setError(`${labels.partial} ${errorMessage(error)}`);
      }
      window.dispatchEvent(new Event("picasso-api-updated"));
      return true;
    } catch (error) {
      setError(`${labels.error}: ${errorMessage(error)}`);
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function refresh() {
    if (lock.current) return;
    setLoading(true);
    setError("");
    try {
      await load();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }
  function startPreviewSession(next: EmployeeSession) {
    setSession(next);
    setActiveTab(next.role === "empleado" ? "supplies" : "menu");
  }
  function logout() {
    if (busy) return;
    setSession(null);
    setData(emptyPanelData);
    setSupplies([]);
    setInventory([]);
    setEmployees([]);
    pendingStock.current.clear();
    pendingInventory.current.clear();
    pendingEmployees.current.clear();
    setDraft(null);
    setIsCreatingDish(false);
    draftDirty.current = false;
    setPendingOrder(null);
    setSaveMessage("");
    setError("");
  }
  function changeTab(tab: DashboardTab) {
    if (!busy) setActiveTab(tab);
  }
  function selectDish(dish: EditableDish) {
    if (busy) return;
    setSelectedDishKey(getEditableDishKey(dish));
    setDraft(dish);
    setIsCreatingDish(false);
    draftDirty.current = false;
    setSaveMessage("");
    setGalleryKeys(
      dishes.filter((item) => item.showImage).map(getEditableDishKey),
    );
  }
  function startNewDish() {
    if (!isAdmin) return;
    setDraft({
      id: 0,
      categoryId: sections[0]?.id,
      categoryTitle: sections[0]?.title ?? "",
      available: true,
      name: "",
      price: "0",
      description: "",
      image: "/images/Plato01.png",
      recipe: "",
      recipeSupplies: [],
    });
    setSelectedDishKey("0");
    setIsCreatingDish(true);
    draftDirty.current = true;
    setSaveMessage("");
  }
  function updateDraft(
    field: keyof EditableDish,
    value: string | boolean | string[] | RecipeSupply[],
  ) {
    if (!isAdmin) return;
    draftDirty.current = true;
    setDraft((current) => {
      if (!current) return current;
      if (field === "categoryId") {
        const category = sections.find(
          (section) => section.id === Number(value),
        );
        return {
          ...current,
          categoryId: category?.id,
          categoryTitle: category?.title ?? "",
        };
      }
      return { ...current, [field]: value };
    });
  }
  function toggleFlag(setKeys: typeof setGalleryKeys, checked: boolean) {
    if (!isAdmin || !draft) return;
    draftDirty.current = true;
    const key = getEditableDishKey(draft);
    setKeys((current) =>
      checked
        ? [...new Set([...current, key])]
        : current.filter((item) => item !== key),
    );
  }
  function saveDish() {
    if (!isAdmin || !draft) return;
    let savedDishId = draft.id;
    void mutate(
      async () => {
        if (!draft.name.trim() || !positive(draft.categoryId))
          throw new Error(labels.name + " / " + labels.categoryId);
        const ingredients = (draft.recipeSupplies ?? []).map((recipe) => {
          if (!positive(recipe.ingredientId) || !positive(recipe.unitId))
            throw new Error(labels.ingredientId + " / " + labels.unitId);
          return {
            id: recipe.id,
            ingredientId: recipe.ingredientId!,
            unitId: recipe.unitId!,
            quantity: amount(recipe.quantity),
          };
        });
        if (
          !isCreatingDish &&
          dishes.find((item) => item.id === draft.id)?.description &&
          !draft.description.trim()
        )
          throw new Error(labels.description);
        if (!isCreatingDish && !draft.image?.trim())
          throw new Error(labels.imageUrl);
        const payload = {
          name: draft.name.trim(),
          price: price(draft.price),
          categoryId: draft.categoryId,
          ...(draft.description.trim()
            ? { description: draft.description.trim() }
            : {}),
          ...(draft.image?.trim() ? { imageUrl: draft.image.trim() } : {}),
          internalRecipe: draft.recipe ?? "",
          isAvailable: draft.available,
          showImageInGallery: galleryKeys.includes(getEditableDishKey(draft)),
        };
        if (isCreatingDish) {
          const saved = await request<{ id: number }>("menu", {
            method: "POST",
            body: {
              ...payload,
              ...(ingredients.length
                ? { ingredients: ingredients.map(({ id, ...item }) => item) }
                : {}),
            },
          });
          savedDishId = saved.id;
        } else {
          // Existing recipe edits are atomic with the dish. Adds/removals use their
          // dedicated endpoints; if one fails, report and reload the partial result.
          const existing = ingredients.filter((item) => positive(item.id));
          const added = ingredients.filter((item) => !positive(item.id));
          const removed = (
            data.recipes[String(draft.id)]?.ingredients ?? []
          ).filter((item) => !existing.some((recipe) => recipe.id === item.id));
          let changed = false;
          try {
            await request(`menu/${draft.id}`, {
              method: "PATCH",
              body: {
                ...payload,
                ...(existing.length ? { ingredients: existing } : {}),
              },
            });
            changed = true;
            if (added.length)
              await request("recipes", {
                method: "POST",
                body: {
                  itemId: draft.id,
                  ingredients: added.map(({ id, ...item }) => item),
                },
              });
            if (removed.length)
              await request("recipes", {
                method: "DELETE",
                body: { ids: removed.map((item) => item.id) },
              });
          } catch (error) {
            if (changed) {
              draftDirty.current = false;
              try {
                await load();
              } catch (refreshError) {
                throw new Error(
                  `${labels.partialRecipe} ${labels.partial} ${errorMessage(error)} · ${errorMessage(refreshError)}`,
                );
              }
              window.dispatchEvent(new Event("picasso-api-updated"));
              throw new Error(`${labels.partialRecipe} ${errorMessage(error)}`);
            }
            throw error;
          }
        }
      },
      () => {
        draftDirty.current = false;
        setIsCreatingDish(false);
        setDraft({ ...draft, id: savedDishId });
        setSelectedDishKey(String(savedDishId));
      },
    );
  }
  function deleteDish(dish: EditableDish) {
    if (!isAdmin || !window.confirm(labels.confirmRemove)) return;
    void mutate(
      () => request(`menu/${dish.id}`, { method: "DELETE" }),
      () => {
        draftDirty.current = false;
        setDraft(null);
        setIsCreatingDish(false);
      },
    );
  }

  function addStock(kind: "supplies" | "inventory") {
    if (!isAdmin) return;
    const id = nextDraftId.current--;
    const unit = data.units[0];
    const entry: SupplyRecord = {
      id,
      name: "",
      cost: "0",
      stock: "0",
      threshold: "0",
      unit: unit?.abbreviation ?? "",
      unitId: unit?.id,
    };
    (kind === "supplies" ? pendingStock : pendingInventory).current.add(id);
    (kind === "supplies" ? setSupplies : setInventory)((current) => [
      entry,
      ...current,
    ]);
  }
  function updateStock(
    kind: "supplies" | "inventory",
    id: number,
    field: keyof SupplyRecord,
    value: string,
  ) {
    if (!isAdmin) return;
    (kind === "supplies" ? pendingStock : pendingInventory).current.add(id);
    (kind === "supplies" ? setSupplies : setInventory)((current) =>
      current.map((item) =>
        item.id === id
          ? field === "unitId"
            ? {
                ...item,
                unitId: Number(value),
                unit:
                  data.units.find((unit) => unit.id === Number(value))
                    ?.abbreviation ?? "",
              }
            : { ...item, [field]: value }
          : item,
      ),
    );
  }
  function saveStock(kind: "supplies" | "inventory", id: number) {
    if (!isAdmin) return;
    const row = (kind === "supplies" ? supplies : inventory).find(
      (item) => item.id === id,
    );
    if (!row) return;
    void mutate(
      async () => {
        if (!row.name.trim() || !positive(row.unitId))
          throw new Error(labels.name + " / " + labels.unitId);
        return request(`${kind}${id > 0 ? `/${id}` : ""}`, {
          method: id > 0 ? "PATCH" : "POST",
          body: {
            name: row.name.trim(),
            unitId: row.unitId,
            unitCost: price(row.cost),
            currentStock: amount(row.stock),
            minimumStock: amount(row.threshold),
          },
        });
      },
      () => {
        (kind === "supplies" ? pendingStock : pendingInventory).current.delete(
          id,
        );
        if (id < 0)
          (kind === "supplies" ? setSupplies : setInventory)((current) =>
            current.filter((item) => item.id !== id),
          );
      },
    );
  }
  function removeStock(kind: "supplies" | "inventory", id: number) {
    if (!isAdmin) return;
    if (id < 0) {
      (kind === "supplies" ? pendingStock : pendingInventory).current.delete(
        id,
      );
      (kind === "supplies" ? setSupplies : setInventory)((current) =>
        current.filter((item) => item.id !== id),
      );
      return;
    }
    if (!window.confirm(labels.confirmRemove)) return;
    void mutate(
      () => request(`${kind}/${id}`, { method: "DELETE" }),
      () => {
        (kind === "supplies" ? pendingStock : pendingInventory).current.delete(
          id,
        );
      },
    );
  }

  function addEmployee() {
    if (!isAdmin) return;
    const id = nextDraftId.current--;
    pendingEmployees.current.add(id);
    setEmployees((current) => [
      {
        id,
        name: "",
        active: true,
        email: "",
        phone: "",
        position: "",
        role: "empleado",
        firstName: "",
        lastName: "",
        restaurantId: data.restaurants[0]?.id,
      },
      ...current,
    ]);
  }
  function updateEmployee(
    id: number,
    field: keyof EmployeeRecord,
    value: string | boolean,
  ) {
    if (!isAdmin) return;
    if (field === "email" || field === "role" || field === "position") return;
    if (field === "active") {
      if (id > 0)
        void mutate(
          () =>
            request(`employees/${id}/${value ? "activate" : "deactivate"}`, {
              method: "PATCH",
            }),
          () =>
            setEmployees((current) =>
              current.map((item) =>
                item.id === id ? { ...item, active: Boolean(value) } : item,
              ),
            ),
        );
      return;
    }
    pendingEmployees.current.add(id);
    setEmployees((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: ["userId", "positionId", "restaurantId"].includes(field)
                ? Number(value)
                : value,
            }
          : item,
      ),
    );
  }
  function saveEmployee(id: number) {
    if (!isAdmin) return;
    const row = employees.find((item) => item.id === id);
    if (!row) return;
    void mutate(
      async () => {
        if (
          !row.firstName?.trim() ||
          !row.lastName?.trim() ||
          !positive(row.positionId)
        )
          throw new Error(
            labels.firstName +
              " / " +
              labels.lastName +
              " / " +
              labels.positionId,
          );
        if (
          id > 0 &&
          !row.phone.trim() &&
          data.employees.find((item) => item.id === id)?.phone
        )
          throw new Error(labels.phone);
        const body = {
          ...(row.firstName?.trim() ? { firstName: row.firstName.trim() } : {}),
          ...(row.lastName?.trim() ? { lastName: row.lastName.trim() } : {}),
          ...(row.phone.trim() ? { phone: row.phone.trim() } : {}),
          ...(positive(row.positionId) ? { positionId: row.positionId } : {}),
        };
        if (
          id < 0 &&
          (!body.firstName ||
            !body.lastName ||
            !body.positionId ||
            !positive(row.userId) ||
            !positive(row.restaurantId))
        )
          throw new Error(labels.identity);
        return request(`employees${id > 0 ? `/${id}` : ""}`, {
          method: id > 0 ? "PATCH" : "POST",
          body:
            id > 0
              ? body
              : { ...body, userId: row.userId, restaurantId: row.restaurantId },
        });
      },
      () => {
        pendingEmployees.current.delete(id);
        if (id < 0)
          setEmployees((current) => current.filter((item) => item.id !== id));
      },
    );
  }
  function removeEmployeeDraft(id: number) {
    if (id < 0) {
      pendingEmployees.current.delete(id);
      setEmployees((current) => current.filter((item) => item.id !== id));
    }
  }

  function addOrder() {
    if (!canAddOrders) return;
    setPendingOrder({
      id: 0,
      customer: "",
      table: "",
      total: "",
      notes: "",
      items: "",
      status: "queued",
      type: "takeaway",
      orderLines: [],
      removedIngredientsByDish: {},
    });
    setSelectedOrderId(null);
  }
  function updatePendingOrder(field: keyof OrderRecord, value: string) {
    setPendingOrder((current) =>
      current ? { ...current, [field]: value } : current,
    );
  }
  function updatePendingOrderDishQuantity(
    dish: EditableDish,
    quantity: number,
  ) {
    const key = getEditableDishKey(dish);
    setPendingOrder((current) =>
      current
        ? {
            ...current,
            orderLines: [
              ...(current.orderLines ?? []).filter(
                (line) => line.dishKey !== key,
              ),
              ...(quantity > 0
                ? [
                    {
                      dishKey: key,
                      quantity: Math.min(99, Math.floor(quantity)),
                    },
                  ]
                : []),
            ],
          }
        : current,
    );
  }
  function togglePendingRemovedIngredient(
    dish: EditableDish,
    ingredient: string,
    checked: boolean,
  ) {
    const key = getEditableDishKey(dish);
    setPendingOrder((current) => {
      if (!current) return current;
      const removed = current.removedIngredientsByDish?.[key] ?? [];
      return {
        ...current,
        removedIngredientsByDish: {
          ...current.removedIngredientsByDish,
          [key]: checked
            ? [...new Set([...removed, ingredient])]
            : removed.filter((item) => item !== ingredient),
        },
      };
    });
  }
  function confirmPendingOrder() {
    if (!canAddOrders || !pendingOrder) return;
    void mutate(
      async () => {
        const pending = pendingOrder;
        const type = pending.type ?? "takeaway";
        if (!pending.orderLines?.length) throw new Error(labels.itemId);
        const payload: CreateOrder = {
          type,
          items: pending.orderLines.map((line) => {
            const dish = dishes.find(
              (item) => getEditableDishKey(item) === line.dishKey,
            );
            if (!dish?.available || !positive(dish.id))
              throw new Error(labels.itemId);
            const excluded =
              pending.removedIngredientsByDish?.[line.dishKey] ?? [];
            const modifications = (dish.recipeSupplies ?? [])
              .filter((item) => excluded.includes(item.supplyName))
              .map((item) => {
                if (!positive(item.id)) throw new Error(labels.recipe);
                return { recipeId: item.id! };
              });
            return {
              itemId: dish.id!,
              quantity: line.quantity,
              ...(pending.notes.trim() ? { notes: pending.notes.trim() } : {}),
              ...(modifications.length ? { modifications } : {}),
            };
          }),
        };
        if (pending.customer.trim())
          payload.customerName = pending.customer.trim();
        if (pending.phone?.trim()) payload.customerPhone = pending.phone.trim();
        if (type === "delivery") {
          if (!pending.phone?.trim() || !pending.address?.trim())
            throw new Error(
              labels.customerPhone + " / " + labels.customerAddress,
            );
          payload.customerAddress = pending.address.trim();
        }
        if (type === "dine_in") {
          const id = Number(pending.tableId);
          if (!positive(id)) throw new Error(labels.tableId);
          payload.tableId = id;
        }
        const saved = await createOrder(payload);
        setSelectedOrderId(saved.id);
      },
      () => setPendingOrder(null),
    );
  }
  function updateOrder(id: number, field: keyof OrderRecord, value: string) {
    if (field !== "status") return;
    const order = orders.find((item) => item.id === id);
    if (
      !order ||
      (transitions[order.status as ApiOrderStatus] ?? []).every(
        (status) => status !== value,
      )
    )
      return;
    void mutate(() => updateOrderStatus(id, value as ApiOrderStatus));
  }

  return {
    labels,
    session,
    activeTab,
    setActiveTab: changeTab,
    startPreviewSession,
    logout,
    data,
    sections,
    dishes,
    orders,
    supplies,
    inventory,
    employees,
    isAdmin,
    canViewMenu,
    canAddOrders,
    loading,
    busy,
    error,
    saveMessage,
    refresh,
    draft,
    isCreatingDish,
    selectedDishKey,
    galleryKeys,
    selectDish,
    startNewDish,
    updateDraft,
    saveDish,
    deleteDish,
    toggleGalleryDish: (checked: boolean) =>
      toggleFlag(setGalleryKeys, checked),
    addSupply: () => addStock("supplies"),
    addInventory: () => addStock("inventory"),
    updateSupply: (id: number, field: keyof SupplyRecord, value: string) =>
      updateStock("supplies", id, field, value),
    updateInventoryItem: (
      id: number,
      field: keyof SupplyRecord,
      value: string,
    ) => updateStock("inventory", id, field, value),
    saveSupply: (id: number) => saveStock("supplies", id),
    saveInventory: (id: number) => saveStock("inventory", id),
    deleteSupply: (id: number) => removeStock("supplies", id),
    deleteInventoryItem: (id: number) => removeStock("inventory", id),
    addEmployee,
    updateEmployee,
    saveEmployee,
    removeEmployeeDraft,
    pendingOrder,
    selectedOrderId,
    setSelectedOrderId,
    addOrder,
    confirmPendingOrder,
    cancelPendingOrder: () => setPendingOrder(null),
    updatePendingOrder,
    updatePendingOrderDishQuantity,
    togglePendingRemovedIngredient,
    updateOrder,
  };
}
