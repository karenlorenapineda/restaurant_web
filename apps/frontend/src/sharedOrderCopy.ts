import type { Locale } from "./i18n";

export interface SharedOrderCopy {
  title: string;
  subtitle: string;
  demo: string;
  createTitle: string;
  joinTitle: string;
  yourName: string;
  table: string;
  chooseTable: string;
  tableLabel: (number: string, seats: number) => string;
  createButton: string;
  joinCode: string;
  joinButton: string;
  tablesError: string;
  nameRequired: string;
  codeInvalid: string;
  tableRequired: string;
  code: string;
  copyLink: string;
  copied: string;
  tableNumber: string;
  people: string;
  online: string;
  offline: string;
  menu: string;
  add: string;
  loadingMenu: string;
  noDishes: string;
  sharedOrder: string;
  emptyOrder: string;
  addedBy: string;
  quantity: (name: string) => string;
  increase: string;
  decrease: string;
  remove: string;
  notes: string;
  notesFor: (name: string) => string;
  total: string;
  send: string;
  sending: string;
  sent: string;
  sentDetail: (orderId: number) => string;
  newTable: string;
  leave: string;
  reconnecting: string;
  restoring: string;
  closedTitle: string;
  closed: Record<string, string>;
  backToStart: string;
  errors: Record<string, string>;
  unknownError: string;
  dismiss: string;
}

const cop = (locale: string) => (amount: number) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatMoney: Record<Locale, (amount: number) => string> = {
  es: cop("es-CO"),
  en: cop("en-US"),
  pt: cop("pt-PT"),
};

export const SHARED_ORDER_COPY: Record<Locale, SharedOrderCopy> = {
  es: {
    title: "Pedido compartido de mesa",
    subtitle:
      "Pedid juntos: todos veis y editáis el mismo pedido en tiempo real y se envía a cocina de una vez.",
    demo: "El pedido compartido necesita la API real. En modo demostración no está disponible.",
    createTitle: "Crear un pedido de mesa",
    joinTitle: "Unirse con un código",
    yourName: "Tu nombre",
    table: "Mesa",
    chooseTable: "Elige una mesa",
    tableLabel: (number, seats) => `Mesa ${number} (${seats} personas)`,
    createButton: "Crear pedido",
    joinCode: "Código de la mesa",
    joinButton: "Unirme",
    tablesError: "No se pudieron cargar las mesas.",
    nameRequired: "Escribe tu nombre (hasta 30 caracteres).",
    codeInvalid: "El código tiene 6 letras o números.",
    tableRequired: "Elige una mesa.",
    code: "Código",
    copyLink: "Copiar enlace",
    copied: "Enlace copiado",
    tableNumber: "Mesa",
    people: "En la mesa",
    online: "conectado",
    offline: "desconectado",
    menu: "Carta",
    add: "Añadir",
    loadingMenu: "Cargando la carta…",
    noDishes: "No hay platos disponibles.",
    sharedOrder: "Pedido de la mesa",
    emptyOrder: "Todavía no hay platos. Añade el primero de la carta.",
    addedBy: "añadido por",
    quantity: (name) => `Cantidad de ${name}`,
    increase: "Más",
    decrease: "Menos",
    remove: "Quitar",
    notes: "Notas (opcional)",
    notesFor: (name) => `Notas de ${name}`,
    total: "Total",
    send: "Enviar pedido a cocina",
    sending: "Enviando…",
    sent: "¡Pedido enviado a cocina!",
    sentDetail: (id) => `Número de pedido: ${id}.`,
    newTable: "Empezar otro pedido",
    leave: "Salir de la mesa",
    reconnecting: "Sin conexión. Reconectando…",
    restoring: "Volviendo a tu mesa…",
    closedTitle: "Esta mesa ya no está disponible",
    closed: {
      expired: "Llevaba demasiado tiempo sin actividad.",
      abandoned: "Se quedó sin nadie conectado.",
      sent: "El pedido ya se envió y se cerró la mesa.",
      gone: "Ya no existe o caducó.",
    },
    backToStart: "Volver al inicio",
    errors: {
      "Table not found": "Esa mesa no existe.",
      "Shared order not found": "No existe ninguna mesa con ese código.",
      "This order has already been sent": "Ese pedido ya se envió a cocina.",
      "This table is full": "La mesa está llena (máximo 12 personas).",
      "Dish not available": "Ese plato no está disponible ahora.",
      "That dish is no longer in the order": "Otra persona ya quitó ese plato.",
      "The order is being sent": "El pedido se está enviando.",
      "Add at least one dish first": "Añade al menos un plato antes de enviar.",
      "The order has too many lines": "El pedido tiene demasiadas líneas.",
      "You are not in a shared order":
        "Ya no estás en una mesa. Vuelve a unirte.",
      "The shared order changed, try again":
        "El pedido cambió, inténtalo de nuevo.",
      "Too many shared orders are open right now":
        "Hay demasiados pedidos abiertos. Inténtalo más tarde.",
      "Too many requests, slow down":
        "Demasiadas acciones seguidas. Espera un momento.",
      offline: "No hay conexión con el servidor.",
      timeout: "El servidor tarda en responder. Inténtalo de nuevo.",
    },
    unknownError: "No se pudo completar la acción.",
    dismiss: "Cerrar aviso",
  },
  en: {
    title: "Shared table order",
    subtitle:
      "Order together: everyone sees and edits the same order in real time, and it goes to the kitchen at once.",
    demo: "The shared order needs the real API. It is not available in demo mode.",
    createTitle: "Start a table order",
    joinTitle: "Join with a code",
    yourName: "Your name",
    table: "Table",
    chooseTable: "Choose a table",
    tableLabel: (number, seats) => `Table ${number} (${seats} seats)`,
    createButton: "Create order",
    joinCode: "Table code",
    joinButton: "Join",
    tablesError: "The tables could not be loaded.",
    nameRequired: "Enter your name (up to 30 characters).",
    codeInvalid: "The code has 6 letters or digits.",
    tableRequired: "Choose a table.",
    code: "Code",
    copyLink: "Copy link",
    copied: "Link copied",
    tableNumber: "Table",
    people: "At the table",
    online: "online",
    offline: "offline",
    menu: "Menu",
    add: "Add",
    loadingMenu: "Loading the menu…",
    noDishes: "There are no dishes available.",
    sharedOrder: "Table order",
    emptyOrder: "No dishes yet. Add the first one from the menu.",
    addedBy: "added by",
    quantity: (name) => `Quantity of ${name}`,
    increase: "More",
    decrease: "Less",
    remove: "Remove",
    notes: "Notes (optional)",
    notesFor: (name) => `Notes for ${name}`,
    total: "Total",
    send: "Send order to the kitchen",
    sending: "Sending…",
    sent: "Order sent to the kitchen!",
    sentDetail: (id) => `Order number: ${id}.`,
    newTable: "Start another order",
    leave: "Leave the table",
    reconnecting: "Offline. Reconnecting…",
    restoring: "Returning to your table…",
    closedTitle: "This table is no longer available",
    closed: {
      expired: "It had been inactive for too long.",
      abandoned: "Nobody was connected any more.",
      sent: "The order was sent and the table closed.",
      gone: "It no longer exists or it expired.",
    },
    backToStart: "Back to start",
    errors: {
      "Table not found": "That table does not exist.",
      "Shared order not found": "There is no table with that code.",
      "This order has already been sent":
        "That order was already sent to the kitchen.",
      "This table is full": "The table is full (12 people at most).",
      "Dish not available": "That dish is not available right now.",
      "That dish is no longer in the order":
        "Someone else already removed that dish.",
      "The order is being sent": "The order is being sent.",
      "Add at least one dish first": "Add at least one dish before sending.",
      "The order has too many lines": "The order has too many lines.",
      "You are not in a shared order":
        "You are no longer at a table. Join again.",
      "The shared order changed, try again": "The order changed, try again.",
      "Too many shared orders are open right now":
        "Too many orders are open. Try again later.",
      "Too many requests, slow down":
        "Too many actions in a row. Wait a moment.",
      offline: "There is no connection to the server.",
      timeout: "The server is slow to answer. Try again.",
    },
    unknownError: "The action could not be completed.",
    dismiss: "Dismiss notice",
  },
  pt: {
    title: "Pedido partilhado da mesa",
    subtitle:
      "Peçam juntos: todos veem e editam o mesmo pedido em tempo real e ele segue para a cozinha de uma vez.",
    demo: "O pedido partilhado precisa da API real. Não está disponível no modo de demonstração.",
    createTitle: "Criar um pedido de mesa",
    joinTitle: "Entrar com um código",
    yourName: "O seu nome",
    table: "Mesa",
    chooseTable: "Escolha uma mesa",
    tableLabel: (number, seats) => `Mesa ${number} (${seats} lugares)`,
    createButton: "Criar pedido",
    joinCode: "Código da mesa",
    joinButton: "Entrar",
    tablesError: "Não foi possível carregar as mesas.",
    nameRequired: "Escreva o seu nome (até 30 caracteres).",
    codeInvalid: "O código tem 6 letras ou números.",
    tableRequired: "Escolha uma mesa.",
    code: "Código",
    copyLink: "Copiar ligação",
    copied: "Ligação copiada",
    tableNumber: "Mesa",
    people: "Na mesa",
    online: "ligado",
    offline: "desligado",
    menu: "Menu",
    add: "Adicionar",
    loadingMenu: "A carregar o menu…",
    noDishes: "Não há pratos disponíveis.",
    sharedOrder: "Pedido da mesa",
    emptyOrder: "Ainda não há pratos. Adicione o primeiro do menu.",
    addedBy: "adicionado por",
    quantity: (name) => `Quantidade de ${name}`,
    increase: "Mais",
    decrease: "Menos",
    remove: "Remover",
    notes: "Notas (opcional)",
    notesFor: (name) => `Notas de ${name}`,
    total: "Total",
    send: "Enviar pedido para a cozinha",
    sending: "A enviar…",
    sent: "Pedido enviado para a cozinha!",
    sentDetail: (id) => `Número do pedido: ${id}.`,
    newTable: "Começar outro pedido",
    leave: "Sair da mesa",
    reconnecting: "Sem ligação. A voltar a ligar…",
    restoring: "A voltar à sua mesa…",
    closedTitle: "Esta mesa já não está disponível",
    closed: {
      expired: "Esteve demasiado tempo sem atividade.",
      abandoned: "Ficou sem ninguém ligado.",
      sent: "O pedido foi enviado e a mesa fechada.",
      gone: "Já não existe ou expirou.",
    },
    backToStart: "Voltar ao início",
    errors: {
      "Table not found": "Essa mesa não existe.",
      "Shared order not found": "Não existe nenhuma mesa com esse código.",
      "This order has already been sent":
        "Esse pedido já foi enviado para a cozinha.",
      "This table is full": "A mesa está cheia (máximo 12 pessoas).",
      "Dish not available": "Esse prato não está disponível agora.",
      "That dish is no longer in the order":
        "Outra pessoa já removeu esse prato.",
      "The order is being sent": "O pedido está a ser enviado.",
      "Add at least one dish first":
        "Adicione pelo menos um prato antes de enviar.",
      "The order has too many lines": "O pedido tem linhas a mais.",
      "You are not in a shared order": "Já não está numa mesa. Entre de novo.",
      "The shared order changed, try again": "O pedido mudou, tente de novo.",
      "Too many shared orders are open right now":
        "Há demasiados pedidos abertos. Tente mais tarde.",
      "Too many requests, slow down":
        "Demasiadas ações seguidas. Espere um momento.",
      offline: "Não há ligação ao servidor.",
      timeout: "O servidor demora a responder. Tente de novo.",
    },
    unknownError: "Não foi possível concluir a ação.",
    dismiss: "Fechar aviso",
  },
};

/** Turns the server's English message into the chosen language. */
export function errorText(message: string, copy: SharedOrderCopy): string {
  const known = copy.errors[message];
  if (known) return known;
  const quantity = /^At most (\d+) of each dish$/.exec(message);
  if (quantity) {
    return copy === SHARED_ORDER_COPY.en
      ? `At most ${quantity[1]} of each dish.`
      : copy === SHARED_ORDER_COPY.pt
        ? `No máximo ${quantity[1]} de cada prato.`
        : `Como máximo ${quantity[1]} de cada plato.`;
  }
  return copy.unknownError;
}
