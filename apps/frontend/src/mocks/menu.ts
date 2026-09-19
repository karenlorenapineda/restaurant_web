import type { Dish, MenuSection } from "../data/menu";

// Fallback menu content for frontend previews only. Replace with backend data for production.
export const mockFeaturedDishes: Dish[] = [
  {
    id: 201,
    name: "Plato especial de la casa",
    description: "Receta principal del asadero preparada para compartir.",
    price: "$46.000 COP",
    image: "/images/Plato01.png",
  },
  {
    id: 202,
    name: "Parrillada familiar",
    description: "Carnes de la casa con acompanamientos colombianos.",
    price: "$42.000 COP",
    image: "/images/Plato02.png",
  },
  {
    id: 203,
    name: "Plato tradicional colombiano",
    description: "Sabor casero con ingredientes frescos y porcion generosa.",
    price: "$38.000 COP",
    image: "/images/Plato03.png",
  },
];

export const mockMenuSections: MenuSection[] = [
  {
    title: "Entradas",
    items: [
      {
        id: 101,
        name: "Entrada criolla",
        description: "Bocado de la casa para abrir la mesa con sabor local.",
        price: "$14.000 COP",
        image: "/images/Plato04.png",
      },
      {
        id: 102,
        name: "Antojo del asadero",
        description: "Preparacion crocante servida con salsa de la casa.",
        price: "$13.000 COP",
        image: "/images/Plato05.png",
      },
      {
        id: 103,
        name: "Entrada dulce y salada",
        description: "Contraste colombiano servido caliente para compartir.",
        price: "$15.000 COP",
        image: "/images/Plato06.png",
      },
    ],
  },
  {
    title: "Platos colombianos",
    items: [
      {
        id: 201,
        name: "Plato especial de la casa",
        description: "Receta principal del asadero preparada para compartir.",
        price: "$46.000 COP",
        image: "/images/Plato01.png",
      },
      {
        id: 202,
        name: "Parrillada familiar",
        description: "Carnes de la casa con acompanamientos colombianos.",
        price: "$42.000 COP",
        image: "/images/Plato02.png",
      },
      {
        id: 203,
        name: "Plato tradicional colombiano",
        description: "Sabor casero con ingredientes frescos y porcion generosa.",
        price: "$38.000 COP",
        image: "/images/Plato03.png",
      },
      {
        id: 204,
        name: "Especial a la brasa",
        description: "Preparacion caliente con el toque ahumado de la cocina.",
        price: "$34.000 COP",
        image: "/images/Plato07.png",
      },
    ],
  },
  {
    title: "Bebidas y postres",
    items: [
      {
        id: 301,
        name: "Limonada de panela",
        description: "Panela, limon fresco y hielo.",
        price: "$8.000 COP",
      },
      {
        id: 302,
        name: "Jugo de lulo",
        description: "Preparado en agua o leche.",
        price: "$9.000 COP",
      },
      {
        id: 303,
        name: "Tres leches",
        description: "Bizcocho suave, crema de leche y toque de canela.",
        price: "$11.000 COP",
      },
    ],
  },
];
