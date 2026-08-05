export interface RecipeSupply {
  quantity: string;
  supplyName: string;
  unit: string;
}

export interface Dish {
  id?: number;
  name: string;
  description: string;
  price: string;
  image?: string;
  available?: boolean;
  recipe?: string;
  recipeIngredients?: string[];
  recipeSupplies?: RecipeSupply[];
}

export interface MenuSection {
  id?: number;
  title: string;
  description?: string | null;
  items: Dish[];
}

export const featuredDishes: Dish[] = [
  {
    id: 201,
    name: "Bandeja paisa familiar",
    description:
      "Frijoles, arroz, chicharron, carne molida, chorizo, huevo, tajada, arepa y aguacate.",
    price: "$46.000 COP",
    image:
      "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 202,
    name: "Pollo asado colombiano",
    description:
      "Pollo al carbon con papa salada, yuca, arepa, ensalada y ajies de la casa.",
    price: "$42.000 COP",
    image:
      "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 203,
    name: "Sancocho trifasico",
    description:
      "Sopa abundante con res, pollo, cerdo, yuca, platano, papa, mazorca y cilantro.",
    price: "$38.000 COP",
    image:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=85",
  },
];

export const menuSections: MenuSection[] = [
  {
    title: "Entradas",
    items: [
      {
        id: 101,
        name: "Empanadas vallunas",
        description:
          "Masa de maiz, carne desmechada, papa criolla y aji de la casa.",
        price: "$14.000 COP",
      },
      {
        id: 102,
        name: "Patacones con hogao",
        description:
          "Platano verde crocante con tomate, cebolla larga y cilantro.",
        price: "$13.000 COP",
      },
      {
        id: 103,
        name: "Aborrajado",
        description:
          "Platano maduro relleno de queso, dorado y servido caliente.",
        price: "$15.000 COP",
      },
    ],
  },
  {
    title: "Platos colombianos",
    items: [
      {
        id: 201,
        name: "Bandeja paisa familiar",
        description:
          "Frijoles, arroz, chicharron, carne molida, chorizo, huevo, tajada, arepa y aguacate.",
        price: "$46.000 COP",
      },
      {
        id: 202,
        name: "Pollo asado colombiano",
        description:
          "Pollo al carbon con papa salada, yuca, arepa, ensalada y ajies de la casa.",
        price: "$42.000 COP",
      },
      {
        id: 203,
        name: "Sancocho trifasico",
        description:
          "Res, pollo, cerdo, yuca, platano, papa, mazorca y cilantro.",
        price: "$38.000 COP",
      },
      {
        id: 204,
        name: "Chuleta valluna",
        description:
          "Cerdo apanado, arroz, papas a la francesa, ensalada y limon.",
        price: "$34.000 COP",
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
