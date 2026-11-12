import type { Insight } from "./api/userActivity";
import type { Locale } from "./i18n";

export interface UserActivityCopy {
  title: string;
  subtitle: string;
  demo: string;
  filters: string;
  from: string;
  to: string;
  groupBy: string;
  day: string;
  week: string;
  month: string;
  restaurant: string;
  restaurantPlaceholder: string;
  metric: string;
  messages: string;
  orders: string;
  apply: string;
  reset: string;
  loading: string;
  error: string;
  retry: string;
  invalidRange: string;
  invalidRestaurant: string;
  period: string;
  kpiTotalUsers: string;
  kpiActiveUsers: string;
  kpiVerified: string;
  kpiNewUsers: string;
  kpiDormant: string;
  kpiNeverLoggedIn: string;
  kpiMessages: string;
  kpiChatters: string;
  kpiUnread: string;
  kpiFriendships: string;
  kpiOrdersHandled: string;
  kpiEmployees: string;
  signupsChart: string;
  chatChart: string;
  rolesChart: string;
  topChart: string;
  messagesSeries: string;
  noData: string;
  insights: string;
  noInsights: string;
  export: string;
  exportCsv: string;
  exportPdf: string;
  exportReport: string;
  reports: Record<
    | "summary"
    | "signups-over-time"
    | "chat-activity-over-time"
    | "users-by-role"
    | "top-active-users"
    | "insights",
    string
  >;
  note: string;
  users: string;
  activeUsers: string;
  revenue: string;
}

export const USER_ACTIVITY_COPY: Record<Locale, UserActivityCopy> = {
  es: {
    title: "Actividad de usuarios",
    subtitle:
      "Altas, chat, roles y pedidos atendidos, con las conclusiones más importantes del periodo.",
    demo: "Este panel necesita la API real. En modo demostración no hay datos de actividad.",
    filters: "Filtros",
    from: "Desde",
    to: "Hasta",
    groupBy: "Agrupar por",
    day: "Día",
    week: "Semana",
    month: "Mes",
    restaurant: "Restaurante (ID)",
    restaurantPlaceholder: "Todos",
    metric: "Ranking por",
    messages: "Mensajes",
    orders: "Pedidos",
    apply: "Aplicar",
    reset: "Restablecer",
    loading: "Cargando datos…",
    error: "No se pudieron cargar los datos",
    retry: "Reintentar",
    invalidRange: "La fecha de inicio no puede ser posterior a la de fin.",
    invalidRestaurant:
      "El ID del restaurante debe ser un número entero positivo.",
    period: "Periodo",
    kpiTotalUsers: "Usuarios totales",
    kpiActiveUsers: "Usuarios activos",
    kpiVerified: "Verificados",
    kpiNewUsers: "Altas nuevas",
    kpiDormant: "Inactivos (30 días)",
    kpiNeverLoggedIn: "Nunca han entrado",
    kpiMessages: "Mensajes de chat",
    kpiChatters: "Usuarios que escriben",
    kpiUnread: "Mensajes sin leer",
    kpiFriendships: "Amistades nuevas",
    kpiOrdersHandled: "Pedidos atendidos",
    kpiEmployees: "Empleados activos",
    signupsChart: "Altas de usuarios",
    chatChart: "Mensajes de chat",
    rolesChart: "Usuarios por rol",
    topChart: "Usuarios más activos",
    messagesSeries: "mensajes",
    noData: "Sin datos en este periodo.",
    insights: "Conclusiones",
    noInsights: "No hay conclusiones para este periodo.",
    export: "Exportar",
    exportCsv: "CSV",
    exportPdf: "PDF",
    exportReport: "Informe",
    reports: {
      summary: "Resumen",
      "signups-over-time": "Altas en el tiempo",
      "chat-activity-over-time": "Chat en el tiempo",
      "users-by-role": "Usuarios por rol",
      "top-active-users": "Usuarios más activos",
      insights: "Conclusiones",
    },
    note: "Los días se miden en UTC. El contenido de los mensajes nunca se lee: solo se cuentan.",
    users: "usuarios",
    activeUsers: "activos",
    revenue: "ventas",
  },
  en: {
    title: "User activity",
    subtitle:
      "Sign-ups, chat, roles and handled orders, with the key takeaways for the period.",
    demo: "This dashboard needs the real API. There is no activity data in demo mode.",
    filters: "Filters",
    from: "From",
    to: "To",
    groupBy: "Group by",
    day: "Day",
    week: "Week",
    month: "Month",
    restaurant: "Restaurant (ID)",
    restaurantPlaceholder: "All",
    metric: "Ranking by",
    messages: "Messages",
    orders: "Orders",
    apply: "Apply",
    reset: "Reset",
    loading: "Loading data…",
    error: "The data could not be loaded",
    retry: "Try again",
    invalidRange: "The start date cannot be after the end date.",
    invalidRestaurant: "The restaurant ID must be a positive whole number.",
    period: "Period",
    kpiTotalUsers: "Total users",
    kpiActiveUsers: "Active users",
    kpiVerified: "Verified",
    kpiNewUsers: "New sign-ups",
    kpiDormant: "Inactive (30 days)",
    kpiNeverLoggedIn: "Never logged in",
    kpiMessages: "Chat messages",
    kpiChatters: "Users who write",
    kpiUnread: "Unread messages",
    kpiFriendships: "New friendships",
    kpiOrdersHandled: "Orders handled",
    kpiEmployees: "Active employees",
    signupsChart: "User sign-ups",
    chatChart: "Chat messages",
    rolesChart: "Users by role",
    topChart: "Most active users",
    messagesSeries: "messages",
    noData: "No data in this period.",
    insights: "Insights",
    noInsights: "There are no insights for this period.",
    export: "Export",
    exportCsv: "CSV",
    exportPdf: "PDF",
    exportReport: "Report",
    reports: {
      summary: "Summary",
      "signups-over-time": "Sign-ups over time",
      "chat-activity-over-time": "Chat over time",
      "users-by-role": "Users by role",
      "top-active-users": "Most active users",
      insights: "Insights",
    },
    note: "Days are measured in UTC. Message content is never read: messages are only counted.",
    users: "users",
    activeUsers: "active",
    revenue: "sales",
  },
  pt: {
    title: "Atividade dos utilizadores",
    subtitle:
      "Registos, chat, funções e pedidos atendidos, com as principais conclusões do período.",
    demo: "Este painel precisa da API real. No modo de demonstração não há dados de atividade.",
    filters: "Filtros",
    from: "De",
    to: "Até",
    groupBy: "Agrupar por",
    day: "Dia",
    week: "Semana",
    month: "Mês",
    restaurant: "Restaurante (ID)",
    restaurantPlaceholder: "Todos",
    metric: "Ranking por",
    messages: "Mensagens",
    orders: "Pedidos",
    apply: "Aplicar",
    reset: "Repor",
    loading: "A carregar dados…",
    error: "Não foi possível carregar os dados",
    retry: "Tentar de novo",
    invalidRange: "A data de início não pode ser posterior à data de fim.",
    invalidRestaurant:
      "O ID do restaurante deve ser um número inteiro positivo.",
    period: "Período",
    kpiTotalUsers: "Utilizadores totais",
    kpiActiveUsers: "Utilizadores ativos",
    kpiVerified: "Verificados",
    kpiNewUsers: "Novos registos",
    kpiDormant: "Inativos (30 dias)",
    kpiNeverLoggedIn: "Nunca entraram",
    kpiMessages: "Mensagens de chat",
    kpiChatters: "Utilizadores que escrevem",
    kpiUnread: "Mensagens por ler",
    kpiFriendships: "Novas amizades",
    kpiOrdersHandled: "Pedidos atendidos",
    kpiEmployees: "Funcionários ativos",
    signupsChart: "Registos de utilizadores",
    chatChart: "Mensagens de chat",
    rolesChart: "Utilizadores por função",
    topChart: "Utilizadores mais ativos",
    messagesSeries: "mensagens",
    noData: "Sem dados neste período.",
    insights: "Conclusões",
    noInsights: "Não há conclusões para este período.",
    export: "Exportar",
    exportCsv: "CSV",
    exportPdf: "PDF",
    exportReport: "Relatório",
    reports: {
      summary: "Resumo",
      "signups-over-time": "Registos ao longo do tempo",
      "chat-activity-over-time": "Chat ao longo do tempo",
      "users-by-role": "Utilizadores por função",
      "top-active-users": "Utilizadores mais ativos",
      insights: "Conclusões",
    },
    note: "Os dias são medidos em UTC. O conteúdo das mensagens nunca é lido: apenas são contadas.",
    users: "utilizadores",
    activeUsers: "ativos",
    revenue: "vendas",
  },
};

const WEEKDAYS: Record<Locale, Record<string, string>> = {
  es: {
    Sunday: "domingos",
    Monday: "lunes",
    Tuesday: "martes",
    Wednesday: "miércoles",
    Thursday: "jueves",
    Friday: "viernes",
    Saturday: "sábados",
  },
  en: {
    Sunday: "Sundays",
    Monday: "Mondays",
    Tuesday: "Tuesdays",
    Wednesday: "Wednesdays",
    Thursday: "Thursdays",
    Friday: "Fridays",
    Saturday: "Saturdays",
  },
  pt: {
    Sunday: "domingos",
    Monday: "segundas",
    Tuesday: "terças",
    Wednesday: "quartas",
    Thursday: "quintas",
    Friday: "sextas",
    Saturday: "sábados",
  },
};

const SUBJECT: Record<Locale, Record<string, string>> = {
  es: { signups_trend: "Las altas nuevas", chat_trend: "Los mensajes de chat" },
  en: { signups_trend: "New sign-ups", chat_trend: "Chat messages" },
  pt: {
    signups_trend: "Os novos registos",
    chat_trend: "As mensagens de chat",
  },
};

function num(value: number | string | null | undefined): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

/**
 * Translates an insight from its stable `key` and numbers. If the key or the
 * numbers are not recognised it falls back to the API's English message.
 */
export function insightText(insight: Insight, locale: Locale): string {
  const d = insight.data;
  const subject = SUBJECT[locale][insight.key];

  if (subject && "current" in d && "previous" in d) {
    const current = num(d.current);
    const previous = num(d.previous);
    const change = d.changePercent;
    const nums = `${previous} → ${current}`;
    if (change === null || change === undefined) {
      return {
        es:
          current === 0
            ? `${subject}: sin actividad en este periodo ni en el anterior.`
            : `${subject}: ${current} en este periodo y ninguna en el anterior.`,
        en:
          current === 0
            ? `${subject}: no activity in this period or the previous one.`
            : `${subject}: ${current} in this period, none in the previous one.`,
        pt:
          current === 0
            ? `${subject}: sem atividade neste período nem no anterior.`
            : `${subject}: ${current} neste período e nenhuma no anterior.`,
      }[locale];
    }
    const pct = Math.abs(num(change));
    const word =
      insight.level === "positive"
        ? { es: "suben", en: "are up", pt: "sobem" }[locale]
        : insight.level === "warning"
          ? { es: "bajan", en: "are down", pt: "descem" }[locale]
          : {
              es: "se mantienen estables",
              en: "are stable",
              pt: "mantêm-se estáveis",
            }[locale];
    const suffix = insight.level === "info" ? "" : ` ${pct}%`;
    const vs = {
      es: "frente al periodo anterior",
      en: "vs the previous period",
      pt: "face ao período anterior",
    }[locale];
    return `${subject} ${word}${suffix} ${vs} (${nums}).`;
  }

  if (insight.key === "dormant_users") {
    const text = {
      es: `${num(d.dormantUsers)} de ${num(d.activeUsers)} usuarios activos (${num(d.sharePercent)}%) no entran desde hace 30 días o nunca lo han hecho.`,
      en: `${num(d.dormantUsers)} of ${num(d.activeUsers)} active users (${num(d.sharePercent)}%) have not logged in for 30 days or never did.`,
      pt: `${num(d.dormantUsers)} de ${num(d.activeUsers)} utilizadores ativos (${num(d.sharePercent)}%) não entram há 30 dias ou nunca entraram.`,
    };
    return text[locale];
  }

  if (insight.key === "unread_messages") {
    const text = {
      es: `El ${num(d.ratePercent)}% de los mensajes enviados en este periodo sigue sin leer.`,
      en: `${num(d.ratePercent)}% of the chat messages sent in this period are still unread.`,
      pt: `${num(d.ratePercent)}% das mensagens enviadas neste período continuam por ler.`,
    };
    return text[locale];
  }

  if (insight.key === "peak_chat_time" && typeof d.weekday === "string") {
    const day = WEEKDAYS[locale][d.weekday];
    if (day) {
      const hour = `${String(num(d.hourUtc)).padStart(2, "0")}:00 UTC`;
      return {
        es: `La mayoría de los mensajes se envían los ${day}, sobre todo hacia las ${hour}.`,
        en: `Most chat messages are sent on ${day}, mainly around ${hour}.`,
        pt: `A maioria das mensagens é enviada às ${day}, sobretudo por volta das ${hour}.`,
      }[locale];
    }
  }

  return insight.message;
}
