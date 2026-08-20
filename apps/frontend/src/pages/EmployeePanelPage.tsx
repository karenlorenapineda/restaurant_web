import { FormEvent, useEffect, useMemo, useState } from "react";

import { fetchMenu } from "../api/menu";
import type { EditableDish } from "../menuStore";
import {
  addDishToSections,
  flattenMenu,
  getEditableDishKey,
  getMenuForEditing,
  loadFeaturedDishKeys,
  loadGalleryDishKeys,
  loadStoredMenu,
  saveFeaturedDishKeys,
  saveGalleryDishKeys,
  saveStoredMenu,
  setFeaturedDish,
  setGalleryDish,
  updateDishInSections,
} from "../menuStore";
import type { NavigationHandlers } from "../navigation";
import type { RecipeSupply } from "../data/menu";
import {
  ChatManagement,
  EmployeesManagement,
  MenuManagement,
  OrdersManagement,
  SuppliesManagement,
  TabButton,
} from "../features/employee-panel/EmployeePanelSections";
import {
  getDishRecipeSupplies,
  getOrderItemsLabel,
  getOrderLines,
  updateSuppliesForDishQuantityChange,
  updateSuppliesForOrderConfirmation,
  updateSuppliesForOrderRemoval,
  updateSupplyForSingleRecipeSupply,
} from "../features/employee-panel/helpers";
import {
  MOCK_CHAT_MESSAGES,
  MOCK_EMPLOYEES,
  MOCK_INVENTORY,
  MOCK_ORDERS,
  MOCK_PREVIEW_SESSIONS,
  MOCK_SUPPLIES,
} from "../mocks/employeePanel";
import type {
  ChatMessage,
  DashboardTab,
  EmployeeRecord,
  EmployeeSession,
  OrderLine,
  OrderRecord,
  SupplyRecord,
} from "../mocks/employeePanel";

function createEmptyDish(categoryTitle: string): EditableDish {
  return {
    available: true,
    categoryTitle,
    description: "",
    id: Date.now(),
    image: "/images/nuevo-plato.jpg",
    name: "Nuevo plato colombiano",
    price: "$0 COP",
    recipe: "Describe aqui los pasos internos de preparacion.",
    recipeIngredients: [],
    recipeSupplies: [],
  };
}

function createEmptyEmployee(): EmployeeRecord {
  return {
    active: true,
    email: "nuevo@picasso.co",
    id: Date.now(),
    name: "Nuevo empleado",
    phone: "+57",
    position: "Servicio",
    role: "empleado",
  };
}

function createEmptySupply(): SupplyRecord {
  return {
    cost: "$0 COP",
    id: Date.now(),
    name: "Nuevo insumo",
    stock: "0",
    threshold: "0",
    unit: "und",
  };
}

function createEmptyOrder(dishes: EditableDish[]): OrderRecord {
  const firstDish = dishes.find((dish) => dish.available) ?? dishes[0];
  const dishKey = firstDish ? getEditableDishKey(firstDish) : "";

  return {
    customer: "Cliente nuevo",
    dishKeys: dishKey ? [dishKey] : [],
    id: Date.now(),
    items: firstDish?.name ?? "Plato por definir",
    notes: "",
    orderLines: dishKey ? [{ dishKey, quantity: 1 }] : [],
    removedIngredientsByDish: {},
    status: "cola",
    table: "Mesa",
    total: firstDish?.price ?? "$0 COP",
  };
}

export function EmployeePanelPage({
  navigate,
}: Pick<NavigationHandlers, "navigate">) {
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("menu");
  const [sections, setSections] = useState(getMenuForEditing);
  const dishes = useMemo(() => flattenMenu(sections), [sections]);
  const [selectedDishKey, setSelectedDishKey] = useState(
    dishes[0] ? getEditableDishKey(dishes[0]) : "",
  );
  const selectedDish =
    dishes.find((dish) => getEditableDishKey(dish) === selectedDishKey) ??
    dishes[0];
  const [draft, setDraft] = useState<EditableDish | null>(selectedDish ?? null);
  const [isCreatingDish, setIsCreatingDish] = useState(false);
  const [featuredKeys, setFeaturedKeys] = useState(loadFeaturedDishKeys);
  const [galleryKeys, setGalleryKeys] = useState(loadGalleryDishKeys);
  const [employees, setEmployees] = useState(() => MOCK_EMPLOYEES);
  const [supplies, setSupplies] = useState(() => MOCK_SUPPLIES);
  const [inventory, setInventory] = useState(() => MOCK_INVENTORY);
  const [chatMessages, setChatMessages] = useState(() => MOCK_CHAT_MESSAGES);
  const [selectedChatEmployeeId, setSelectedChatEmployeeId] = useState(
    MOCK_EMPLOYEES[0]?.id ?? 1,
  );
  const [orders, setOrders] = useState(() => MOCK_ORDERS);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
    MOCK_ORDERS[0]?.id ?? null,
  );
  const [pendingOrder, setPendingOrder] = useState<OrderRecord | null>(null);
  const [saveMessage, setSaveMessage] = useState("");

  const isAdmin = session?.role === "admin";
  const canViewMenu = isAdmin || session?.role === "cocina";
  const canAddOrders = isAdmin || session?.role === "empleado";

  useEffect(() => {
    if (session && activeTab === "employees" && !isAdmin) {
      setActiveTab("supplies");
      return;
    }

    if (session && activeTab === "menu" && !canViewMenu) {
      setActiveTab("supplies");
    }
  }, [activeTab, canViewMenu, isAdmin, session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const selectedEmployee = employees.find(
      (employee) => employee.id === selectedChatEmployeeId,
    );

    if (!selectedEmployee || selectedEmployee.name === session.name) {
      const firstAvailableEmployee = employees.find(
        (employee) => employee.active && employee.name !== session.name,
      );

      if (firstAvailableEmployee) {
        setSelectedChatEmployeeId(firstAvailableEmployee.id);
      }
    }
  }, [employees, selectedChatEmployeeId, session]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMenu() {
      if (loadStoredMenu()) {
        return;
      }

      try {
        const apiSections = await fetchMenu(controller.signal);

        if (!controller.signal.aborted && apiSections.length > 0) {
          setSections(apiSections);
          const firstDish = flattenMenu(apiSections)[0];
          if (firstDish) {
            setSelectedDishKey(getEditableDishKey(firstDish));
            setDraft(firstDish);
          }
        }
      } catch {
        // The panel keeps the local example menu when the backend is unavailable.
      }
    }

    void loadMenu();
    return () => controller.abort();
  }, []);

  function startPreviewSession(nextSession: EmployeeSession) {
    setSession(nextSession);
    setActiveTab(nextSession.role === "empleado" ? "supplies" : "menu");
  }

  function logout() {
    setSession(null);
  }
  function selectDish(dish: EditableDish) {
    setSelectedDishKey(getEditableDishKey(dish));
    setDraft(dish);
    setIsCreatingDish(false);
    setSaveMessage("");
  }

  function startNewDish() {
    if (!isAdmin) {
      return;
    }

    const newDish = createEmptyDish(sections[0]?.title ?? "Platos fuertes");
    setDraft(newDish);
    setSelectedDishKey(getEditableDishKey(newDish));
    setIsCreatingDish(true);
    setSaveMessage("");
  }

  function updateDraft(
    field: keyof EditableDish,
    value: string | boolean | string[] | RecipeSupply[],
  ) {
    if (!isAdmin) {
      return;
    }

    if (!draft) {
      return;
    }

    setDraft({ ...draft, [field]: value });
  }

  function saveDish() {
    if (!isAdmin) {
      return;
    }

    if (!draft) {
      return;
    }

    const nextSections = isCreatingDish
      ? addDishToSections(sections, draft)
      : updateDishInSections(sections, selectedDishKey, draft);

    setSections(nextSections);
    setSelectedDishKey(getEditableDishKey(draft));
    setIsCreatingDish(false);
    saveStoredMenu(nextSections);
    setSaveMessage("Preview menu updated for this session.");
  }

  function deleteDish(dish: EditableDish) {
    if (!isAdmin) {
      return;
    }

    const dishKey = getEditableDishKey(dish);
    const nextSections = sections.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => getEditableDishKey(item) !== dishKey,
      ),
    }));
    const nextDishes = flattenMenu(nextSections);
    const nextFeaturedKeys = featuredKeys.filter((key) => key !== dishKey);
    const nextGalleryKeys = galleryKeys.filter((key) => key !== dishKey);

    setSections(nextSections);
    setFeaturedKeys(nextFeaturedKeys);
    setGalleryKeys(nextGalleryKeys);
    saveStoredMenu(nextSections);
    saveFeaturedDishKeys(nextFeaturedKeys);
    saveGalleryDishKeys(nextGalleryKeys);

    const nextSelectedDish = nextDishes[0] ?? null;
    setSelectedDishKey(
      nextSelectedDish ? getEditableDishKey(nextSelectedDish) : "",
    );
    setDraft(nextSelectedDish);
    setIsCreatingDish(false);
    setSaveMessage("Plato eliminado de la carta.");
  }

  function toggleFeaturedDish(isFeatured: boolean) {
    if (!isAdmin) {
      return;
    }

    if (!draft) {
      return;
    }

    const nextKeys = setFeaturedDish(draft, isFeatured, featuredKeys);
    setFeaturedKeys(nextKeys);
    saveFeaturedDishKeys(nextKeys);
  }

  function toggleGalleryDish(isSelectedForGallery: boolean) {
    if (!isAdmin) {
      return;
    }

    if (!draft) {
      return;
    }

    const nextKeys = setGalleryDish(draft, isSelectedForGallery, galleryKeys);
    setGalleryKeys(nextKeys);
    saveGalleryDishKeys(nextKeys);
  }

  function saveEmployees(nextEmployees: EmployeeRecord[]) {
    setEmployees(nextEmployees);
  }

  function deleteEmployee(employeeId: number) {
    saveEmployees(employees.filter((employee) => employee.id !== employeeId));
  }

  function updateEmployee(
    employeeId: number,
    field: keyof EmployeeRecord,
    value: string | boolean,
  ) {
    if (field === "role" && !isAdmin) {
      return;
    }

    saveEmployees(
      employees.map((employee) =>
        employee.id === employeeId ? { ...employee, [field]: value } : employee,
      ),
    );
  }

  function saveSupplies(nextSupplies: SupplyRecord[]) {
    setSupplies(nextSupplies);
  }

  function deleteSupply(supplyId: number) {
    if (!isAdmin) {
      return;
    }

    saveSupplies(supplies.filter((supply) => supply.id !== supplyId));
  }

  function updateSupply(
    supplyId: number,
    field: keyof SupplyRecord,
    value: string,
  ) {
    if (!isAdmin) {
      return;
    }

    saveSupplies(
      supplies.map((supply) =>
        supply.id === supplyId ? { ...supply, [field]: value } : supply,
      ),
    );
  }

  function saveInventory(nextInventory: SupplyRecord[]) {
    setInventory(nextInventory);
  }

  function deleteInventoryItem(inventoryItemId: number) {
    if (!isAdmin) {
      return;
    }

    saveInventory(
      inventory.filter((inventoryItem) => inventoryItem.id !== inventoryItemId),
    );
  }

  function updateInventoryItem(
    inventoryItemId: number,
    field: keyof SupplyRecord,
    value: string,
  ) {
    if (!isAdmin) {
      return;
    }

    saveInventory(
      inventory.map((inventoryItem) =>
        inventoryItem.id === inventoryItemId
          ? { ...inventoryItem, [field]: value }
          : inventoryItem,
      ),
    );
  }

  function saveOrders(nextOrders: OrderRecord[]) {
    setOrders(nextOrders);
  }

  function addOrder() {
    if (!canAddOrders) {
      return;
    }

    const nextOrder = createEmptyOrder(dishes);
    setPendingOrder(nextOrder);
    setSelectedOrderId(null);
  }

  function confirmPendingOrder() {
    if (!canAddOrders || !pendingOrder) {
      return;
    }

    if (getOrderLines(pendingOrder, dishes).length === 0) {
      return;
    }

    saveSupplies(
      updateSuppliesForOrderConfirmation(supplies, pendingOrder, dishes),
    );
    saveOrders([...orders, pendingOrder]);
    setSelectedOrderId(pendingOrder.id);
    setPendingOrder(null);
  }

  function cancelPendingOrder() {
    setPendingOrder(null);
    setSelectedOrderId(orders[0]?.id ?? null);
  }

  function updatePendingOrder(field: keyof OrderRecord, value: string) {
    if (!canAddOrders || !pendingOrder) {
      return;
    }

    setPendingOrder({ ...pendingOrder, [field]: value });
  }

  function updateOrder(
    orderId: number,
    field: keyof OrderRecord,
    value: string,
  ) {
    if (field !== "status" && !canAddOrders) {
      return;
    }

    saveOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, [field]: value } : order,
      ),
    );
  }

  function deleteOrder(orderId: number) {
    if (!canAddOrders) {
      return;
    }

    const orderToDelete = orders.find((order) => order.id === orderId);
    const nextOrders = orders.filter((order) => order.id !== orderId);

    if (orderToDelete) {
      saveSupplies(
        updateSuppliesForOrderRemoval(supplies, orderToDelete, dishes),
      );
    }

    saveOrders(nextOrders);
    setSelectedOrderId(nextOrders[0]?.id ?? null);
  }

  function updateOrderDishQuantity(
    orderId: number,
    dish: EditableDish,
    nextQuantity: number,
  ) {
    if (!canAddOrders) {
      return;
    }

    const dishKey = getEditableDishKey(dish);
    const normalizedQuantity = Math.max(0, Math.floor(nextQuantity));
    const currentOrder = orders.find((order) => order.id === orderId);
    const currentOrderLine = currentOrder
      ? getOrderLines(currentOrder, dishes).find(
          (orderLine) => orderLine.dishKey === dishKey,
        )
      : null;
    const currentQuantity = currentOrderLine?.quantity ?? 0;
    const quantityDelta = normalizedQuantity - currentQuantity;

    if (quantityDelta !== 0) {
      saveSupplies(
        updateSuppliesForDishQuantityChange(
          supplies,
          dish,
          quantityDelta,
          currentOrder?.removedIngredientsByDish?.[dishKey] ?? [],
        ),
      );
    }

    saveOrders(
      orders.map((order) => {
        if (order.id !== orderId) {
          return order;
        }

        const nextOrderLines = [
          ...getOrderLines(order, dishes).filter(
            (orderLine) => orderLine.dishKey !== dishKey,
          ),
          ...(normalizedQuantity > 0
            ? [{ dishKey, quantity: normalizedQuantity }]
            : []),
        ];

        return {
          ...order,
          dishKeys: nextOrderLines.flatMap((orderLine) =>
            Array.from({ length: orderLine.quantity }, () => orderLine.dishKey),
          ),
          items: getOrderItemsLabel(nextOrderLines, dishes),
          orderLines: nextOrderLines,
        };
      }),
    );
  }

  function updatePendingOrderDishQuantity(
    dish: EditableDish,
    nextQuantity: number,
  ) {
    if (!canAddOrders || !pendingOrder) {
      return;
    }

    const dishKey = getEditableDishKey(dish);
    const normalizedQuantity = Math.max(0, Math.floor(nextQuantity));
    const nextOrderLines = [
      ...getOrderLines(pendingOrder, dishes).filter(
        (orderLine) => orderLine.dishKey !== dishKey,
      ),
      ...(normalizedQuantity > 0
        ? [{ dishKey, quantity: normalizedQuantity }]
        : []),
    ];

    setPendingOrder({
      ...pendingOrder,
      dishKeys: nextOrderLines.flatMap((orderLine) =>
        Array.from({ length: orderLine.quantity }, () => orderLine.dishKey),
      ),
      items: getOrderItemsLabel(nextOrderLines, dishes),
      orderLines: nextOrderLines,
    });
  }

  function toggleRemovedIngredient(
    orderId: number,
    dish: EditableDish,
    ingredient: string,
    checked: boolean,
  ) {
    if (!canAddOrders) {
      return;
    }

    const dishKey = getEditableDishKey(dish);
    const currentOrder = orders.find((order) => order.id === orderId);
    const orderLineQuantity = currentOrder
      ? (getOrderLines(currentOrder, dishes).find(
          (orderLine) => orderLine.dishKey === dishKey,
        )?.quantity ?? 0)
      : 0;

    if (orderLineQuantity > 0) {
      saveSupplies(
        updateSupplyForSingleRecipeSupply(
          supplies,
          dish,
          ingredient,
          checked ? -orderLineQuantity : orderLineQuantity,
        ),
      );
    }

    saveOrders(
      orders.map((order) => {
        if (order.id !== orderId) {
          return order;
        }

        const removedIngredientsByDish = order.removedIngredientsByDish ?? {};
        const currentRemovedIngredients =
          removedIngredientsByDish[dishKey] ?? [];
        const nextRemovedIngredients = checked
          ? currentRemovedIngredients.includes(ingredient)
            ? currentRemovedIngredients
            : [...currentRemovedIngredients, ingredient]
          : currentRemovedIngredients.filter(
              (currentIngredient) => currentIngredient !== ingredient,
            );

        return {
          ...order,
          removedIngredientsByDish: {
            ...removedIngredientsByDish,
            [dishKey]: nextRemovedIngredients,
          },
        };
      }),
    );
  }

  function togglePendingRemovedIngredient(
    dish: EditableDish,
    ingredient: string,
    checked: boolean,
  ) {
    if (!canAddOrders || !pendingOrder) {
      return;
    }

    const dishKey = getEditableDishKey(dish);
    const removedIngredientsByDish =
      pendingOrder.removedIngredientsByDish ?? {};
    const currentRemovedIngredients = removedIngredientsByDish[dishKey] ?? [];
    const nextRemovedIngredients = checked
      ? currentRemovedIngredients.includes(ingredient)
        ? currentRemovedIngredients
        : [...currentRemovedIngredients, ingredient]
      : currentRemovedIngredients.filter(
          (currentIngredient) => currentIngredient !== ingredient,
        );

    setPendingOrder({
      ...pendingOrder,
      removedIngredientsByDish: {
        ...removedIngredientsByDish,
        [dishKey]: nextRemovedIngredients,
      },
    });
  }

  function sendChatMessage(
    event: FormEvent<HTMLFormElement>,
    recipient: EmployeeRecord,
  ) {
    event.preventDefault();

    if (!session) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const text = String(formData.get("message") ?? "").trim();

    if (!text) {
      return;
    }

    const nextMessages = [
      ...chatMessages,
      {
        author: session.name,
        id: Date.now(),
        recipient: recipient.name,
        role: session.role,
        text,
        time: new Intl.DateTimeFormat("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date()),
      },
    ];

    setChatMessages(nextMessages);
    event.currentTarget.reset();
  }

  if (!session) {
    return (
      <section className="flex min-h-screen items-center bg-[linear-gradient(135deg,#120d0b_0%,#26201b_55%,#130d0b_100%)] px-5 py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e8b45f]">
              Employee dashboard preview
            </p>
            <h1 className="mt-4 font-display text-5xl font-bold tracking-[0.04em] sm:text-7xl">
              Frontend-only restaurant operations preview
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-9 text-zinc-300">
              Choose a role to preview the dashboard screens. This does not
              authenticate users, grant real permissions, or replace backend
              access control.
            </p>
          </div>

          <div className="rounded-md border border-white/10 bg-[#333333] p-6 shadow-2xl shadow-black/40">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e8b45f]">
              Preview role
            </p>
            <div className="mt-5 grid gap-3">
              {MOCK_PREVIEW_SESSIONS.map((previewSession) => (
                <button
                  className="rounded-sm border border-white/10 bg-zinc-950 px-5 py-4 text-left transition hover:border-[#e8b45f]"
                  key={previewSession.role}
                  onClick={() => startPreviewSession(previewSession)}
                  type="button"
                >
                  <span className="block font-bold text-white">
                    {previewSession.name}
                  </span>
                  <span className="mt-1 block text-sm text-zinc-400">
                    Role: {previewSession.role}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-5 rounded-sm border border-[#e8b45f]/30 bg-black/25 p-4 text-sm leading-6 text-zinc-300">
              Mock mode only: data changes stay in this browser and must be
              replaced with real backend authentication before production.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#242424_0%,#242424_48%,#242424_100%)] px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid gap-7 lg:grid-cols-[320px_1fr] xl:grid-cols-[340px_1fr]">
          <aside className="rounded-md border border-[#e8b45f]/25 bg-[linear-gradient(180deg,#333333_0%,#242424_100%)] p-6 shadow-2xl shadow-black/35 lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e8b45f]">
              Sesion activa
            </p>
            <h1 className="mt-3 whitespace-normal break-normal font-display text-[1.7rem] font-bold leading-tight tracking-[0.015em] text-white xl:text-3xl">
              {session.name}
            </h1>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#e8b45f]">
              Rol: {session.role}
            </p>
            <div className="mt-6 grid gap-2">
              {canViewMenu ? (
                <>
                  <TabButton
                    active={activeTab === "menu"}
                    label="Menu"
                    onClick={() => setActiveTab("menu")}
                  />
                </>
              ) : null}
              {isAdmin ? (
                <TabButton
                  active={activeTab === "employees"}
                  label="Empleados"
                  onClick={() => setActiveTab("employees")}
                />
              ) : null}
              <TabButton
                active={activeTab === "supplies"}
                label="Insumos"
                onClick={() => setActiveTab("supplies")}
              />
              <TabButton
                active={activeTab === "inventory"}
                label="Inventario"
                onClick={() => setActiveTab("inventory")}
              />
              <TabButton
                active={activeTab === "orders"}
                label="Pedidos"
                onClick={() => setActiveTab("orders")}
              />
              <TabButton
                active={activeTab === "chat"}
                label="Chat"
                onClick={() => setActiveTab("chat")}
              />
            </div>
            <div className="mt-6 grid gap-3 border-t border-white/10 pt-6">
              {isAdmin ? (
                <a
                  className="inline-flex justify-center rounded-sm border border-[#e8b45f] bg-black/15 px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-[#e8b45f] transition hover:bg-[#e8b45f] hover:text-zinc-950"
                  href="/menu"
                  onClick={(event) => navigate("/menu", event)}
                >
                  Ver carta
                </a>
              ) : null}
              <button
                className="rounded-sm border border-white/15 bg-black/15 px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-zinc-300 transition hover:bg-white/10"
                onClick={logout}
                type="button"
              >
                Salir
              </button>
            </div>
          </aside>

          <div>
            <div className="rounded-md border border-white/10 bg-[#333333] p-5 shadow-2xl shadow-black/30 sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e8b45f]">
                Panel de empleados
              </p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-[0.035em] sm:text-6xl">
                Gestion interna del asadero
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-9 text-zinc-300">
                {isAdmin
                  ? "Carta, favoritos, galeria, equipo, inventario y chat interno preparados para conectarse despues a la base de datos."
                  : session.role === "cocina"
                    ? "Consulta la carta, revisa insumos, mira pedidos activos y conversa con el equipo desde el chat interno."
                    : "Consulta insumos, mira pedidos activos y conversa con el equipo desde el chat interno."}
              </p>
            </div>

            {activeTab === "menu" && canViewMenu ? (
              <MenuManagement
                canEdit={isAdmin}
                dishes={dishes}
                draft={draft}
                featuredKeys={featuredKeys}
                galleryKeys={galleryKeys}
                isCreatingDish={isCreatingDish}
                saveDish={saveDish}
                saveMessage={saveMessage}
                sections={sections}
                selectedDishKey={selectedDishKey}
                selectDish={selectDish}
                startNewDish={startNewDish}
                supplies={supplies}
                deleteDish={deleteDish}
                toggleFeaturedDish={toggleFeaturedDish}
                toggleGalleryDish={toggleGalleryDish}
                updateDraft={updateDraft}
              />
            ) : null}

            {activeTab === "employees" && isAdmin ? (
              <EmployeesManagement
                employees={employees}
                isAdmin={isAdmin}
                onAdd={() =>
                  saveEmployees([...employees, createEmptyEmployee()])
                }
                onDelete={deleteEmployee}
                onUpdate={updateEmployee}
              />
            ) : null}

            {activeTab === "supplies" ? (
              <SuppliesManagement
                addLabel="Anadir insumo"
                canEdit={isAdmin}
                description="Insumos listos para usar en recetas y pedidos. Estos si se descuentan cuando se confirma un pedido."
                emptyReadOnlyMessage="Vista de consulta para empleados: puedes revisar existencias, costos y minimos, pero la edicion queda para administracion."
                itemNameLabel="Insumo"
                items={supplies}
                onAdd={() => saveSupplies([...supplies, createEmptySupply()])}
                onDelete={deleteSupply}
                onUpdate={updateSupply}
                title="Gestion de insumos"
              />
            ) : null}

            {activeTab === "inventory" ? (
              <SuppliesManagement
                addLabel="Anadir inventario"
                canEdit={isAdmin}
                description="Inventario en bruto o pendiente de preparar. Por ahora es una lista independiente y no se conecta con recetas, pedidos ni descuentos de stock."
                emptyReadOnlyMessage="Vista de consulta: este inventario todavia no afecta pedidos ni insumos preparados."
                itemNameLabel="Articulo"
                items={inventory}
                onAdd={() => saveInventory([...inventory, createEmptySupply()])}
                onDelete={deleteInventoryItem}
                onUpdate={updateInventoryItem}
                title="Inventario"
              />
            ) : null}

            {activeTab === "orders" ? (
              <OrdersManagement
                canEdit={canAddOrders}
                canViewRecipe={canViewMenu}
                dishes={dishes}
                onAdd={addOrder}
                onCancelPending={cancelPendingOrder}
                onConfirmPending={confirmPendingOrder}
                onDelete={deleteOrder}
                onSelect={setSelectedOrderId}
                onTogglePendingRemovedIngredient={
                  togglePendingRemovedIngredient
                }
                onToggleRemovedIngredient={toggleRemovedIngredient}
                onUpdate={updateOrder}
                onUpdateDishQuantity={updateOrderDishQuantity}
                onUpdatePending={updatePendingOrder}
                onUpdatePendingDishQuantity={updatePendingOrderDishQuantity}
                orders={orders}
                pendingOrder={pendingOrder}
                selectedOrderId={selectedOrderId}
              />
            ) : null}

            {activeTab === "chat" ? (
              <ChatManagement
                employees={employees}
                messages={chatMessages}
                onSelectEmployee={setSelectedChatEmployeeId}
                onSend={sendChatMessage}
                selectedEmployeeId={selectedChatEmployeeId}
                session={session}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
