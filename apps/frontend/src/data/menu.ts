export interface Dish {
  id?: number;
  name: string;
  description: string;
  price: string;
  image?: string;
  available?: boolean;
}

export interface MenuSection {
  id?: number;
  title: string;
  description?: string | null;
  items: Dish[];
}

export const featuredDishes: Dish[] = [
  {
    name: "Bandeja paisa",
    description:
      "Frijoles, arroz, chicharron, carne molida, huevo, platano maduro y aguacate.",
    price: "$34.000 COP",
    image:
      "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Ajiaco santafereno",
    description:
      "Sopa tradicional con pollo, papa criolla, mazorca, guascas, crema y alcaparras.",
    price: "$29.000 COP",
    image:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Arepa de huevo",
    description:
      "Arepa frita de maiz amarillo rellena de huevo, servida con suero costeno.",
    price: "$12.000 COP",
    image:
      "https://images.unsplash.com/photo-1625398407796-82650a8c135f?auto=format&fit=crop&w=900&q=85",
  },
];

export const menuSections: MenuSection[] = [
  {
    title: "Entradas",
    items: [
      {
        name: "Empanadas vallunas",
        description:
          "Masa de maiz, carne desmechada, papa criolla y aji de la casa.",
        price: "$14.000 COP",
      },
      {
        name: "Patacones con hogao",
        description:
          "Platano verde crocante con tomate, cebolla larga y cilantro.",
        price: "$13.000 COP",
      },
      {
        name: "Aborrajado",
        description:
          "Platano maduro relleno de queso, dorado y servido caliente.",
        price: "$15.000 COP",
      },
    ],
  },
  {
    title: "Platos fuertes",
    items: [
      {
        name: "Bandeja paisa",
        description:
          "Frijoles, arroz, chicharron, carne molida, huevo, aguacate y arepa.",
        price: "$34.000 COP",
      },
      {
        name: "Sancocho de gallina",
        description:
          "Caldo casero con gallina, yuca, platano, papa y cilantro fresco.",
        price: "$32.000 COP",
      },
      {
        name: "Sobrebarriga en salsa criolla",
        description:
          "Carne lenta, arroz blanco, papa salada, ensalada y tajadas.",
        price: "$36.000 COP",
      },
    ],
  },
  {
    title: "Bebidas y postres",
    items: [
      {
        name: "Limonada de panela",
        description: "Panela, limon fresco y hielo.",
        price: "$8.000 COP",
      },
      {
        name: "Jugo de lulo",
        description: "Preparado en agua o leche.",
        price: "$9.000 COP",
      },
      {
        name: "Tres leches",
        description: "Bizcocho suave, crema de leche y toque de canela.",
        price: "$11.000 COP",
      },
    ],
  },
];
