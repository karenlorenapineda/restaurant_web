import { FormEvent, useEffect, useMemo, useState } from "react";

import { fetchMenu } from "../api/menu";
import type { EditableDish } from "../menuStore";
import {
  addDishToSections,
  countExistingSelectedDishes,
  flattenMenu,
  getEditableDishKey,
  getMenuForEditing,
  isFeaturedDish,
  isGalleryDish,
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

const EMPLOYEE_SESSION_KEY = "picasso.employeeSession";
const EMPLOYEES_STORAGE_KEY = "picasso.employees";
const SUPPLIES_STORAGE_KEY = "picasso.supplies";
const INVENTORY_STORAGE_KEY = "picasso.inventory";
const CHAT_STORAGE_KEY = "picasso.employeeChat";
const ORDERS_STORAGE_KEY = "picasso.orders";

type EmployeeRole = "admin" | "empleado" | "cocina";
type DashboardTab =
  | "menu"
  | "employees"
  | "supplies"
  | "inventory"
  | "orders"
  | "chat";
type OrderStatus = "cola" | "preparando" | "terminado";

interface EmployeeSession {
  email: string;
  name: string;
  role: EmployeeRole;
}

interface EmployeeRecord {
  id: number;
  active: boolean;
  email: string;
  name: string;
  phone: string;
  position: string;
  role: EmployeeRole;
}

interface SupplyRecord {
  id: number;
  cost: string;
  name: string;
  stock: string;
  threshold: string;
  unit: string;
}

interface ChatMessage {
  id: number;
  author: string;
  recipient?: string;
  role: EmployeeRole;
  text: string;
  time: string;
}

interface OrderRecord {
  id: number;
  customer: string;
  dishKeys?: string[];
  items: string;
  notes: string;
  orderLines?: OrderLine[];
  removedIngredientsByDish?: Record<string, string[]>;
  status: OrderStatus | "recibido" | "en cocina" | "listo" | "entregado";
  table: string;
  total: string;
}

interface OrderLine {
  dishKey: string;
  quantity: number;
}

const ORDER_STATUSES: OrderStatus[] = ["cola", "preparando", "terminado"];

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  cola: "En cola",
  preparando: "Preparando",
  terminado: "Terminado",
};

const DEFAULT_RECIPE_BY_DISH: Record<
  string,
  { ingredients: RecipeSupply[]; recipe: string }
> = {
  "Bandeja paisa familiar": {
    ingredients: [
      { quantity: "180", supplyName: "Frijoles", unit: "g" },
      { quantity: "160", supplyName: "Arroz", unit: "g" },
      { quantity: "120", supplyName: "Chicharron", unit: "g" },
      { quantity: "120", supplyName: "Carne molida", unit: "g" },
      { quantity: "1", supplyName: "Chorizo", unit: "und" },
      { quantity: "1", supplyName: "Huevo", unit: "und" },
      { quantity: "1", supplyName: "Tajada madura", unit: "und" },
      { quantity: "1", supplyName: "Arepa", unit: "und" },
      { quantity: "0.5", supplyName: "Aguacate", unit: "und" },
    ],
    recipe:
      "Calentar frijoles y arroz, dorar chicharron y chorizo, terminar con huevo frito, tajada, arepa y aguacate al pase.",
  },
  "Pollo asado colombiano": {
    ingredients: [
      { quantity: "1", supplyName: "Pollo entero", unit: "und" },
      { quantity: "180", supplyName: "Papa criolla", unit: "g" },
      { quantity: "150", supplyName: "Yuca", unit: "g" },
      { quantity: "1", supplyName: "Arepa", unit: "und" },
      { quantity: "80", supplyName: "Ensalada", unit: "g" },
      { quantity: "30", supplyName: "Aji", unit: "g" },
    ],
    recipe:
      "Marinar el pollo, asar al carbon hasta dorar, reposar y servir con papa, yuca, arepa, ensalada y aji de la casa.",
  },
  "Sancocho trifasico": {
    ingredients: [
      { quantity: "120", supplyName: "Carne de res", unit: "g" },
      { quantity: "120", supplyName: "Pollo entero", unit: "g" },
      { quantity: "100", supplyName: "Cerdo", unit: "g" },
      { quantity: "160", supplyName: "Yuca", unit: "g" },
      { quantity: "0.5", supplyName: "Platano", unit: "und" },
      { quantity: "150", supplyName: "Papa criolla", unit: "g" },
      { quantity: "0.5", supplyName: "Mazorca", unit: "und" },
      { quantity: "10", supplyName: "Cilantro", unit: "g" },
    ],
    recipe:
      "Cocer carnes por etapas, agregar tuberculos y mazorca, rectificar sal y terminar con cilantro fresco.",
  },
  "Empanadas vallunas": {
    ingredients: [
      { quantity: "80", supplyName: "Masa de maiz", unit: "g" },
      { quantity: "55", supplyName: "Carne desmechada", unit: "g" },
      { quantity: "45", supplyName: "Papa criolla", unit: "g" },
      { quantity: "25", supplyName: "Aji", unit: "g" },
    ],
    recipe:
      "Rellenar la masa con carne y papa, cerrar, freir hasta dorar y servir con aji aparte.",
  },
};

const LOGIN_USERS: Array<EmployeeSession & { password: string }> = [
  {
    email: "admin@picasso.co",
    name: "Administracion Picasso",
    password: "Admin2026",
    role: "admin",
  },
  {
    email: "empleado@picasso.co",
    name: "Equipo de sala",
    password: "Picasso2026",
    role: "empleado",
  },
  {
    email: "cocina@picasso.co",
    name: "Equipo de cocina",
    password: "Cocina2026",
    role: "cocina",
  },
];

const DEFAULT_EMPLOYEES: EmployeeRecord[] = [
  {
    active: true,
    email: "admin@picasso.co",
    id: 1,
    name: "Administracion Picasso",
    phone: "+57 300 000 0000",
    position: "Gerencia",
    role: "admin",
  },
  {
    active: true,
    email: "juan.parrilla@picasso.co",
    id: 2,
    name: "Juan Parrilla",
    phone: "+57 301 111 2233",
    position: "Asador",
    role: "cocina",
  },
  {
    active: true,
    email: "laura.mesa@picasso.co",
    id: 3,
    name: "Laura Mesa",
    phone: "+57 302 444 5566",
    position: "Servicio de mesa",
    role: "empleado",
  },
];

const DEFAULT_SUPPLIES: SupplyRecord[] = [
  {
    cost: "$18.000 COP",
    id: 1,
    name: "Carne de res",
    stock: "32",
    threshold: "10",
    unit: "kg",
  },
  {
    cost: "$13.500 COP",
    id: 2,
    name: "Pollo entero",
    stock: "45",
    threshold: "12",
    unit: "und",
  },
  {
    cost: "$4.200 COP",
    id: 3,
    name: "Papa criolla",
    stock: "28",
    threshold: "8",
    unit: "kg",
  },
  {
    cost: "$3.900 COP",
    id: 4,
    name: "Yuca",
    stock: "24",
    threshold: "8",
    unit: "kg",
  },
  {
    cost: "$7.500 COP",
    id: 5,
    name: "Lulo",
    stock: "18",
    threshold: "6",
    unit: "kg",
  },
];

const DEFAULT_INVENTORY: SupplyRecord[] = [
  {
    cost: "$16.000 COP",
    id: 1,
    name: "Bulto de papa sin lavar",
    stock: "50",
    threshold: "15",
    unit: "kg",
  },
  {
    cost: "$95.000 COP",
    id: 2,
    name: "Canastilla de pollo crudo",
    stock: "12",
    threshold: "4",
    unit: "caja",
  },
  {
    cost: "$38.000 COP",
    id: 3,
    name: "Saco de arroz",
    stock: "8",
    threshold: "3",
    unit: "bulto",
  },
  {
    cost: "$24.000 COP",
    id: 4,
    name: "Caja de verduras por limpiar",
    stock: "10",
    threshold: "3",
    unit: "caja",
  },
];

const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [
  {
    author: "Administracion Picasso",
    id: 1,
    recipient: "Equipo de cocina",
    role: "admin",
    text: "Recuerden revisar existencias antes del servicio de la noche.",
    time: "09:15",
  },
  {
    author: "Juan Parrilla",
    id: 2,
    recipient: "Administracion Picasso",
    role: "cocina",
    text: "Quedan pollos listos para el primer turno.",
    time: "09:22",
  },
];

const DEFAULT_ORDERS: OrderRecord[] = [
  {
    customer: "Mesa familiar",
    id: 1,
    dishKeys: ["201"],
    items: "Bandeja paisa familiar, 2 limonadas",
    notes: "Sin picante",
    orderLines: [{ dishKey: "201", quantity: 1 }],
    removedIngredientsByDish: { "201": ["aji"] },
    status: "preparando",
    table: "Mesa 4",
    total: "$82.000 COP",
  },
  {
    customer: "Domicilio Rodriguez",
    id: 2,
    dishKeys: ["202"],
    items: "Pollo asado colombiano, yuca, arepas",
    notes: "Enviar cubiertos",
    orderLines: [{ dishKey: "202", quantity: 1 }],
    removedIngredientsByDish: {},
    status: "cola",
    table: "Domicilio",
    total: "$58.000 COP",
  },
  {
    customer: "Reserva 7:30",
    id: 3,
    dishKeys: ["203", "101"],
    items: "Sancocho trifasico, empanadas vallunas",
    notes: "Preparar entrada primero",
    orderLines: [
      { dishKey: "203", quantity: 1 },
      { dishKey: "101", quantity: 1 },
    ],
    removedIngredientsByDish: { "101": ["aji"] },
    status: "terminado",
    table: "Mesa 2",
    total: "$76.000 COP",
  },
];

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

function getDishRecipe(dish: EditableDish) {
  return (
    dish.recipe ??
    DEFAULT_RECIPE_BY_DISH[dish.name]?.recipe ??
    "Receta interna pendiente por completar."
  );
}

function getDishRecipeSupplies(dish: EditableDish) {
  if (dish.recipeSupplies) {
    return dish.recipeSupplies;
  }

  if (dish.recipeIngredients) {
    return dish.recipeIngredients.map((ingredient) => ({
      quantity: "1",
      supplyName: ingredient,
      unit: "und",
    }));
  }

  return DEFAULT_RECIPE_BY_DISH[dish.name]?.ingredients ?? [];
}

function normalizeOrderStatus(status: OrderRecord["status"]): OrderStatus {
  if (status === "en cocina") {
    return "preparando";
  }

  if (status === "listo" || status === "entregado") {
    return "terminado";
  }

  if (status === "recibido") {
    return "cola";
  }

  return status;
}

function getOrderDishes(order: OrderRecord, dishes: EditableDish[]) {
  const dishKeys =
    order.orderLines?.map((orderLine) => orderLine.dishKey) ??
    order.dishKeys ??
    [];

  if (dishKeys.length > 0) {
    return dishKeys
      .map((dishKey) =>
        dishes.find((dish) => getEditableDishKey(dish) === dishKey),
      )
      .filter((dish): dish is EditableDish => Boolean(dish));
  }

  return dishes.filter((dish) => order.items.includes(dish.name));
}

function getOrderLines(order: OrderRecord, dishes: EditableDish[]): OrderLine[] {
  if (order.orderLines) {
    return order.orderLines;
  }

  const dishKeys = order.dishKeys ?? getOrderDishes(order, dishes).map(getEditableDishKey);
  const lineByDishKey = new Map<string, OrderLine>();

  dishKeys.forEach((dishKey) => {
    const currentLine = lineByDishKey.get(dishKey);
    lineByDishKey.set(dishKey, {
      dishKey,
      quantity: (currentLine?.quantity ?? 0) + 1,
    });
  });

  return Array.from(lineByDishKey.values());
}

function getOrderItemsLabel(orderLines: OrderLine[], dishes: EditableDish[]) {
  return orderLines
    .map((orderLine) => {
      const dish = dishes.find(
        (menuDish) => getEditableDishKey(menuDish) === orderLine.dishKey,
      );

      return dish ? `${orderLine.quantity}x ${dish.name}` : "";
    })
    .filter(Boolean)
    .join(", ");
}

function parseNumber(value: string) {
  const parsedValue = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatStock(value: number) {
  const roundedValue = Math.max(0, Math.round(value * 1000) / 1000);
  return Number.isInteger(roundedValue)
    ? String(roundedValue)
    : String(roundedValue).replace(".", ",");
}

function convertRecipeQuantityToSupplyUnit(
  recipeSupply: RecipeSupply,
  supplyUnit: string,
) {
  const quantity = parseNumber(recipeSupply.quantity);
  const recipeUnit = recipeSupply.unit.toLowerCase();
  const normalizedSupplyUnit = supplyUnit.toLowerCase();

  if (recipeUnit === normalizedSupplyUnit) {
    return quantity;
  }

  if (recipeUnit === "g" && normalizedSupplyUnit === "kg") {
    return quantity / 1000;
  }

  if (recipeUnit === "kg" && normalizedSupplyUnit === "g") {
    return quantity * 1000;
  }

  if (recipeUnit === "ml" && normalizedSupplyUnit === "l") {
    return quantity / 1000;
  }

  if (recipeUnit === "l" && normalizedSupplyUnit === "ml") {
    return quantity * 1000;
  }

  return quantity;
}

function updateSuppliesForDishQuantityChange(
  supplies: SupplyRecord[],
  dish: EditableDish,
  quantityDelta: number,
  removedIngredients: string[] = [],
) {
  if (quantityDelta === 0) {
    return supplies;
  }

  return supplies.map((supply) => {
    const recipeSupply = getDishRecipeSupplies(dish).find(
      (currentRecipeSupply) =>
        currentRecipeSupply.supplyName.toLowerCase() ===
        supply.name.toLowerCase(),
    );

    if (!recipeSupply || removedIngredients.includes(recipeSupply.supplyName)) {
      return supply;
    }

    const quantityToDiscount =
      convertRecipeQuantityToSupplyUnit(recipeSupply, supply.unit) *
      quantityDelta;
    const nextStock = parseNumber(supply.stock) - quantityToDiscount;

    return {
      ...supply,
      stock: formatStock(nextStock),
    };
  });
}

function updateSupplyForSingleRecipeSupply(
  supplies: SupplyRecord[],
  dish: EditableDish,
  supplyName: string,
  quantityDelta: number,
) {
  return supplies.map((supply) => {
    const recipeSupply = getDishRecipeSupplies(dish).find(
      (currentRecipeSupply) =>
        currentRecipeSupply.supplyName.toLowerCase() ===
          supply.name.toLowerCase() &&
        currentRecipeSupply.supplyName.toLowerCase() === supplyName.toLowerCase(),
    );

    if (!recipeSupply) {
      return supply;
    }

    const quantityToDiscount =
      convertRecipeQuantityToSupplyUnit(recipeSupply, supply.unit) *
      quantityDelta;

    return {
      ...supply,
      stock: formatStock(parseNumber(supply.stock) - quantityToDiscount),
    };
  });
}

function updateSuppliesForOrderRemoval(
  supplies: SupplyRecord[],
  order: OrderRecord,
  dishes: EditableDish[],
) {
  return getOrderLines(order, dishes).reduce((nextSupplies, orderLine) => {
    const dish = dishes.find(
      (menuDish) => getEditableDishKey(menuDish) === orderLine.dishKey,
    );

    if (!dish) {
      return nextSupplies;
    }

    return updateSuppliesForDishQuantityChange(
      nextSupplies,
      dish,
      -orderLine.quantity,
      order.removedIngredientsByDish?.[orderLine.dishKey] ?? [],
    );
  }, supplies);
}

function updateSuppliesForOrderConfirmation(
  supplies: SupplyRecord[],
  order: OrderRecord,
  dishes: EditableDish[],
) {
  return getOrderLines(order, dishes).reduce((nextSupplies, orderLine) => {
    const dish = dishes.find(
      (menuDish) => getEditableDishKey(menuDish) === orderLine.dishKey,
    );

    if (!dish) {
      return nextSupplies;
    }

    return updateSuppliesForDishQuantityChange(
      nextSupplies,
      dish,
      orderLine.quantity,
      order.removedIngredientsByDish?.[orderLine.dishKey] ?? [],
    );
  }, supplies);
}

function loadSession() {
  const storedSession = window.localStorage.getItem(EMPLOYEE_SESSION_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession) as EmployeeSession;
  } catch {
    window.localStorage.removeItem(EMPLOYEE_SESSION_KEY);
    return null;
  }
}

function loadStoredRecords<T>(storageKey: string, fallback: T[]) {
  const storedRecords = window.localStorage.getItem(storageKey);

  if (!storedRecords) {
    return fallback;
  }

  try {
    return JSON.parse(storedRecords) as T[];
  } catch {
    window.localStorage.removeItem(storageKey);
    return fallback;
  }
}

export function EmployeePanelPage({
  navigate,
}: Pick<NavigationHandlers, "navigate">) {
  const [session, setSession] = useState<EmployeeSession | null>(loadSession);
  const [loginError, setLoginError] = useState("");
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
  const [employees, setEmployees] = useState(() =>
    loadStoredRecords<EmployeeRecord>(EMPLOYEES_STORAGE_KEY, DEFAULT_EMPLOYEES),
  );
  const [supplies, setSupplies] = useState(() =>
    loadStoredRecords<SupplyRecord>(SUPPLIES_STORAGE_KEY, DEFAULT_SUPPLIES),
  );
  const [inventory, setInventory] = useState(() =>
    loadStoredRecords<SupplyRecord>(INVENTORY_STORAGE_KEY, DEFAULT_INVENTORY),
  );
  const [chatMessages, setChatMessages] = useState(() =>
    loadStoredRecords<ChatMessage>(CHAT_STORAGE_KEY, DEFAULT_CHAT_MESSAGES),
  );
  const [selectedChatEmployeeId, setSelectedChatEmployeeId] = useState(
    DEFAULT_EMPLOYEES[0]?.id ?? 1,
  );
  const [orders, setOrders] = useState(() =>
    loadStoredRecords<OrderRecord>(ORDERS_STORAGE_KEY, DEFAULT_ORDERS),
  );
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
    DEFAULT_ORDERS[0]?.id ?? null,
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

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const user = LOGIN_USERS.find(
      (candidate) =>
        candidate.email === email && candidate.password === password,
    );

    if (user) {
      const nextSession = {
        email: user.email,
        name: user.name,
        role: user.role,
      };

      window.localStorage.setItem(
        EMPLOYEE_SESSION_KEY,
        JSON.stringify(nextSession),
      );
      setSession(nextSession);
      setActiveTab(nextSession.role === "empleado" ? "supplies" : "menu");
      setLoginError("");
      return;
    }

    setLoginError("Credenciales incorrectas.");
  }

  function logout() {
    window.localStorage.removeItem(EMPLOYEE_SESSION_KEY);
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
    setSaveMessage("Carta actualizada en este navegador.");
  }

  function deleteDish(dish: EditableDish) {
    if (!isAdmin) {
      return;
    }

    const dishKey = getEditableDishKey(dish);
    const nextSections = sections.map((section) => ({
      ...section,
      items: section.items.filter((item) => getEditableDishKey(item) !== dishKey),
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
    setSelectedDishKey(nextSelectedDish ? getEditableDishKey(nextSelectedDish) : "");
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
    window.localStorage.setItem(
      EMPLOYEES_STORAGE_KEY,
      JSON.stringify(nextEmployees),
    );
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
    window.localStorage.setItem(
      SUPPLIES_STORAGE_KEY,
      JSON.stringify(nextSupplies),
    );
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
    window.localStorage.setItem(
      INVENTORY_STORAGE_KEY,
      JSON.stringify(nextInventory),
    );
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
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(nextOrders));
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

    saveSupplies(updateSuppliesForOrderConfirmation(supplies, pendingOrder, dishes));
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
      saveSupplies(updateSuppliesForOrderRemoval(supplies, orderToDelete, dishes));
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
        const currentRemovedIngredients = removedIngredientsByDish[dishKey] ?? [];
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
    const removedIngredientsByDish = pendingOrder.removedIngredientsByDish ?? {};
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
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(nextMessages));
    event.currentTarget.reset();
  }

  if (!session) {
    return (
      <section className="flex min-h-screen items-center bg-[linear-gradient(135deg,#120d0b_0%,#26201b_55%,#130d0b_100%)] px-5 py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e8b45f]">
              Acceso empleados
            </p>
            <h1 className="mt-4 font-display text-5xl font-bold tracking-[0.04em] sm:text-7xl">
              Panel privado del restaurante familiar
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-9 text-zinc-300">
              Entra para gestionar el trabajo interno del asadero segun tu rol.
              Administracion tiene control completo y el resto del equipo puede
              consultar insumos y hablar por el chat interno.
            </p>
            <div className="mt-8 grid gap-3 rounded-md border border-white/10 bg-black/25 p-5 text-sm text-zinc-300">
              <p>
                Admin demo:{" "}
                <span className="font-bold text-white">
                  admin@picasso.co / Admin2026
                </span>
              </p>
              <p>
                Empleado demo:{" "}
                <span className="font-bold text-white">
                  empleado@picasso.co / Picasso2026
                </span>
              </p>
              <p>
                Cocina demo:{" "}
                <span className="font-bold text-white">
                  cocina@picasso.co / Cocina2026
                </span>
              </p>
            </div>
          </div>

          <form
            className="rounded-md border border-white/10 bg-[#333333] p-6 shadow-2xl shadow-black/40"
            onSubmit={submitLogin}
          >
            <label className="block text-sm font-semibold text-zinc-200">
              Email
              <input
                className="mt-2 w-full rounded-sm border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-[#e8b45f]"
                name="email"
                placeholder="admin@picasso.co"
                type="email"
              />
            </label>
            <label className="mt-5 block text-sm font-semibold text-zinc-200">
              Contrasena
              <input
                className="mt-2 w-full rounded-sm border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-[#e8b45f]"
                name="password"
                placeholder="Admin2026"
                type="password"
              />
            </label>
            {loginError ? (
              <p className="mt-4 text-sm font-semibold text-[#e8b45f]">
                {loginError}
              </p>
            ) : null}
            <button
              className="mt-6 w-full rounded-sm bg-[#e8b45f] px-5 py-3 font-bold uppercase tracking-[0.12em] text-zinc-950 transition hover:bg-white"
              type="submit"
            >
              Entrar
            </button>
          </form>
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
                onAdd={() => saveEmployees([...employees, createEmptyEmployee()])}
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
                onTogglePendingRemovedIngredient={togglePendingRemovedIngredient}
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

function MenuManagement({
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
                  onChange={(event) => updateDraft("recipe", event.target.value)}
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

function EmployeesManagement({
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

function SuppliesManagement({
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
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            {description}
          </p>
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

function OrdersManagement({
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
  onUpdate: (
    orderId: number,
    field: keyof OrderRecord,
    value: string,
  ) => void;
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
                      : onUpdate(selectedOrder.id, "customer", event.target.value)
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
                      (currentOrderLine) => currentOrderLine.dishKey === dishKey,
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

function ChatManagement({
  employees,
  messages,
  onSelectEmployee,
  onSend,
  selectedEmployeeId,
  session,
}: {
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
    (employee) => employee.active && employee.name !== session.name,
  );
  const selectedEmployee =
    availableEmployees.find((employee) => employee.id === selectedEmployeeId) ??
    availableEmployees[0];
  const conversationMessages = selectedEmployee
    ? messages.filter(
        (message) =>
          (message.author === session.name &&
            message.recipient === selectedEmployee.name) ||
          (message.author === selectedEmployee.name &&
            (!message.recipient || message.recipient === session.name)),
      )
    : [];

  return (
    <Panel className="mt-6">
      <div>
        <h3 className="font-display text-3xl font-bold">Chat interno</h3>
        <p className="mt-3 text-sm leading-7 text-zinc-400">
          Conversaciones directas entre empleados del restaurante.
        </p>
      </div>

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
                {employee.position} · {employee.role}
              </p>
            </button>
          ))}
        </div>

        <div>
          <div className="rounded-sm border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e8b45f]">
              Conversacion
            </p>
            <h4 className="mt-2 font-display text-3xl font-bold">
              {selectedEmployee?.name ?? "Sin empleados disponibles"}
            </h4>
          </div>

          <div className="mt-4 grid max-h-[520px] min-h-[360px] gap-4 overflow-auto rounded-sm border border-white/10 bg-zinc-950/55 p-4">
            {conversationMessages.length > 0 ? (
              conversationMessages.map((message) => {
                const isOwnMessage = message.author === session.name;

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
                        {message.role}
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
                No hay mensajes con esta persona.
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
                placeholder={`Mensaje para ${selectedEmployee.name}`}
              />
              <button
                className="rounded-sm bg-[#e8b45f] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-zinc-950 transition hover:bg-white"
                type="submit"
              >
                Enviar
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-white/10 bg-zinc-950/70 p-5 shadow-2xl shadow-black/25">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e8b45f]">
        {label}
      </p>
      <p className="mt-3 font-display text-4xl font-bold">{value}</p>
    </div>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-md border border-white/10 bg-[#333333] p-5 shadow-2xl shadow-black/30 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-sm border px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.12em] shadow-lg shadow-black/10 transition ${
        active
          ? "border-[#e8b45f] bg-[#e8b45f] text-zinc-950"
          : "border-white/10 bg-black/20 text-zinc-300 hover:border-[#e8b45f]/45 hover:bg-[#333333] hover:text-white"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block text-sm font-semibold text-zinc-200">
      {label}
      {children}
    </label>
  );
}

function Checkbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-sm border border-white/10 bg-zinc-950/60 p-4 text-sm font-semibold text-zinc-200">
      <input
        checked={checked}
        className="h-5 w-5 accent-[#e8b45f]"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-sm border border-white/10 bg-black/25 px-4 py-3">
      {label}
    </span>
  );
}

const inputClassName =
  "mt-2 w-full rounded-sm border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-[#e8b45f]";

function getInputClassName(canEdit: boolean) {
  return `${inputClassName} ${
    canEdit ? "" : "cursor-default border-white/10 bg-black/20 text-zinc-300"
  }`;
}

function DeleteButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-white/10 text-lg font-bold leading-none text-zinc-400 transition hover:border-[#e8b45f] hover:bg-[#7f2019] hover:text-white"
      onClick={onClick}
      type="button"
    >
      x
    </button>
  );
}
