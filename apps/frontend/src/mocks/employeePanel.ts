import type { RecipeSupply } from "../data/menu";

// Frontend preview data only. Replace these mocks with backend-backed data before treating the dashboard as a real authenticated workflow.
export type EmployeeRole = "admin" | "empleado" | "cocina";
export type DashboardTab =
  "menu" | "employees" | "supplies" | "inventory" | "orders" | "chat";
export type OrderStatus = "cola" | "preparando" | "terminado";

export interface EmployeeSession {
  email: string;
  name: string;
  role: EmployeeRole;
}

export interface EmployeeRecord {
  id: number;
  active: boolean;
  email: string;
  name: string;
  phone: string;
  position: string;
  role: EmployeeRole;
}

export interface SupplyRecord {
  id: number;
  cost: string;
  name: string;
  stock: string;
  threshold: string;
  unit: string;
}

export interface ChatMessage {
  id: number;
  author: string;
  recipient?: string;
  role: EmployeeRole;
  text: string;
  time: string;
}

export interface OrderRecord {
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

export interface OrderLine {
  dishKey: string;
  quantity: number;
}

export const ORDER_STATUSES: OrderStatus[] = [
  "cola",
  "preparando",
  "terminado",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  cola: "En cola",
  preparando: "Preparando",
  terminado: "Terminado",
};

export const MOCK_RECIPE_BY_DISH: Record<
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

export const MOCK_PREVIEW_SESSIONS: EmployeeSession[] = [
  {
    email: "admin-preview@picasso.local",
    name: "Admin preview",
    role: "admin",
  },
  {
    email: "service-preview@picasso.local",
    name: "Service preview",
    role: "empleado",
  },
  {
    email: "kitchen-preview@picasso.local",
    name: "Kitchen preview",
    role: "cocina",
  },
];

export const MOCK_EMPLOYEES: EmployeeRecord[] = [
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

export const MOCK_SUPPLIES: SupplyRecord[] = [
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

export const MOCK_INVENTORY: SupplyRecord[] = [
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

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
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

export const MOCK_ORDERS: OrderRecord[] = [
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
