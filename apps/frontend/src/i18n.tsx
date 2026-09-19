import { useSyncExternalStore } from "react";
import { employeeEnByEs, employeeEsByEn } from "./employeeTranslations";

export type Locale = "es" | "en";

const storageKey = "picasso-locale";

const enByEs: Record<string, string> = {
  "Navegacion principal": "Main navigation",
  "Abrir menu de navegacion": "Open navigation menu",
  "Restaurante y asadero": "Restaurant and grill",
  "Restaurante y asadero familiar": "Family restaurant and grill",
  CONTACTO: "CONTACT",
  EMPLEADOS: "EMPLOYEES",
  Contacto: "Contact",
  Empleados: "Employees",
  Reservas: "Reservations",
  "Reservar mesa": "Book a table",
  "Espacio logo": "Logo space",
  "Buena comida, grandes momentos": "Good food, great moments",
  "Platos colombianos, carnes al asador y recetas de casa para sentarse en familia y compartir sin prisa.":
    "Colombian dishes, grilled meats and home recipes to enjoy together at your own pace.",
  "Especiales de hoy": "Today's specials",
  "Favoritos editables desde el panel de empleados.":
    "Favorites selected in the employee dashboard.",
  Familiar: "Family size",
  "Descubre el verdadero sabor de casa.": "Discover the taste of home.",
  "Brasa encendida, acompanamientos colombianos y mesas listas para celebraciones, almuerzos familiares y pedidos para recoger.":
    "A warm grill, Colombian sides and tables ready for celebrations, family lunches and takeaway orders.",
  Galeria: "Gallery",
  "Imagenes elegidas desde el panel de empleados.":
    "Images selected in the employee dashboard.",
  "Mesa familiar de restaurante con ambiente calido":
    "Family table in a welcoming restaurant",
  "Mesa servida para reservar en familia": "Table set for a family meal",
  "Fachada del asadero familiar": "Family grill restaurant exterior",
  "Volver al inicio": "Back to home",
  "Carta del asadero": "Grill menu",
  "Menu familiar": "Family menu",
  "Elige un plato para verlo en grande. Carnes al asador, entradas caseras y bebidas para acompanar la mesa.":
    "Choose a dish to see it up close. Grilled meats, homemade starters and drinks for the table.",
  Todos: "All",
  "Cerrar detalle del plato": "Close dish details",
  "Reservas y localizacion": "Reservations and location",
  "Ven con tu familia": "Bring your family",
  "Tenemos mesas para grupos, pedidos para recoger y atencion para celebraciones familiares alrededor de la brasa.":
    "We have tables for groups, takeaway orders and space for family celebrations around the grill.",
  "Abrir mapa": "Open map",
  Nombre: "Name",
  Telefono: "Phone",
  Mensaje: "Message",
  "Enviar mensaje": "Send message",
  "Tu nombre": "Your name",
  "Reserva familiar, pedido para recoger o evento":
    "Family reservation, takeaway order or event",
  "Chat del asadero": "Restaurant chat",
  Hablemos: "Let's talk",
  "Cerrar chat": "Close chat",
  "Abrir chat con el restaurante": "Open restaurant chat",
  "Escribe tu mensaje": "Write your message",
  Enviar: "Send",
  "Hola, somos Picasso Asadero. Quieres reservar, pedir para recoger o consultar la carta?":
    "Hello, this is Picasso Grill. Would you like to book a table, order takeaway or see the menu?",
  "Gracias por escribirnos. El equipo del asadero te respondera pronto.":
    "Thanks for writing. Our team will reply soon.",
  "Comprobando servicios": "Checking services",
  "Servicios no disponibles": "Services unavailable",
  Entradas: "Starters",
  "Platos colombianos": "Colombian dishes",
  "Bebidas y postres": "Drinks and desserts",
  "Empanadas vallunas": "Valle-style empanadas",
  "Patacones con hogao": "Fried plantains with hogao",
  Aborrajado: "Cheese-stuffed fried plantain",
  "Bandeja paisa familiar": "Family bandeja paisa",
  "Pollo asado colombiano": "Colombian roast chicken",
  "Sancocho trifasico": "Three-meat sancocho",
  "Chuleta valluna": "Valle-style pork cutlet",
  "Limonada de panela": "Panela lemonade",
  "Jugo de lulo": "Lulo juice",
  "Tres leches": "Tres leches cake",
  "Entrada criolla": "Creole starter",
  "Antojo del asadero": "Grill house bite",
  "Entrada dulce y salada": "Sweet and savory starter",
  "Plato especial de la casa": "House special plate",
  "Parrillada familiar": "Family grill platter",
  "Plato tradicional colombiano": "Traditional Colombian plate",
  "Especial a la brasa": "Charcoal-grilled special",
  "Receta principal del asadero preparada para compartir.":
    "The grill house signature recipe, made for sharing.",
  "Carnes de la casa con acompanamientos colombianos.":
    "House meats with Colombian sides.",
  "Sabor casero con ingredientes frescos y porcion generosa.":
    "Homemade flavor with fresh ingredients and a generous portion.",
  "Bocado de la casa para abrir la mesa con sabor local.":
    "A house bite to start the table with local flavor.",
  "Preparacion crocante servida con salsa de la casa.":
    "Crispy preparation served with house sauce.",
  "Contraste colombiano servido caliente para compartir.":
    "A Colombian sweet-and-savory contrast served warm to share.",
  "Preparacion caliente con el toque ahumado de la cocina.":
    "A warm dish with the kitchen smoky touch.",
  "Frijoles, arroz, chicharron, carne molida, chorizo, huevo, tajada, arepa y aguacate.":
    "Beans, rice, pork crackling, ground beef, chorizo, egg, fried plantain, arepa and avocado.",
  "Pollo al carbon con papa salada, yuca, arepa, ensalada y ajies de la casa.":
    "Charcoal-roasted chicken with salted potatoes, cassava, arepa, salad and house chili sauces.",
  "Sopa abundante con res, pollo, cerdo, yuca, platano, papa, mazorca y cilantro.":
    "Hearty soup with beef, chicken, pork, cassava, plantain, potatoes, corn and cilantro.",
  "Masa de maiz, carne desmechada, papa criolla y aji de la casa.":
    "Corn pastry with shredded beef, creole potatoes and house chili sauce.",
  "Platano verde crocante con tomate, cebolla larga y cilantro.":
    "Crispy green plantain with tomato, spring onion and cilantro.",
  "Platano maduro relleno de queso, dorado y servido caliente.":
    "Ripe plantain stuffed with cheese, fried golden and served hot.",
  "Res, pollo, cerdo, yuca, platano, papa, mazorca y cilantro.":
    "Beef, chicken, pork, cassava, plantain, potatoes, corn and cilantro.",
  "Cerdo apanado, arroz, papas a la francesa, ensalada y limon.":
    "Breaded pork, rice, fries, salad and lemon.",
  "Panela, limon fresco y hielo.": "Panela, fresh lemon and ice.",
  "Preparado en agua o leche.": "Prepared with water or milk.",
  "Bizcocho suave, crema de leche y toque de canela.":
    "Soft sponge cake, cream and a touch of cinnamon.",
};

const esByEn: Record<string, string> = {
  Home: "Inicio",
  Menu: "Carta",
  HOME: "INICIO",
  MENU: "CARTA",
  "Application and database are online":
    "La aplicación y la base de datos están disponibles",
  Address: "Dirección",
  "Address to be confirmed": "Dirección por confirmar",
  Hours: "Horario",
  "Opening hours to be confirmed": "Horario por confirmar",
  Reservations: "Reservas",
  "Phone to be confirmed": "Teléfono por confirmar",
  "Location to be confirmed": "Ubicación por confirmar",
  "Address pending": "Dirección pendiente",
  "Phone number": "Número de teléfono",
};

function initialLocale(): Locale {
  try {
    return window.localStorage.getItem(storageKey) === "en" ? "en" : "es";
  } catch {
    return "es";
  }
}

let currentLocale: Locale = initialLocale();
if (typeof document !== "undefined")
  document.documentElement.lang = currentLocale;
const listeners = new Set<() => void>();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale) {
  if (locale === currentLocale) return;
  currentLocale = locale;
  document.documentElement.lang = locale;
  try {
    window.localStorage.setItem(storageKey, locale);
  } catch {
    // The selection still works if storage is unavailable.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale, () => "es");
}

export function t(text: string): string {
  const key = text.replace(/\s+/g, " ").trim();
  return currentLocale === "en"
    ? (enByEs[key] ?? employeeEnByEs[key] ?? text)
    : (esByEn[key] ?? employeeEsByEn[key] ?? text);
}

export function T({ children }: { children: string }) {
  useLocale();
  const translated = t(children);
  const trailingSpace =
    / $/.test(children) && !translated.endsWith(" ") ? " " : "";
  return <>{translated + trailingSpace}</>;
}
