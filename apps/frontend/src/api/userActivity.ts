import { ApiError, request } from "./client";

export type GroupBy = "day" | "week" | "month";
export type TopMetric = "messages" | "orders";
export type ExportReport =
  | "summary"
  | "signups-over-time"
  | "chat-activity-over-time"
  | "users-by-role"
  | "top-active-users"
  | "insights";

export interface ActivityFilters {
  /** YYYY-MM-DD or empty (the API then uses the last 30 days). */
  from: string;
  to: string;
  groupBy: GroupBy;
  metric: TopMetric;
  /** Positive integer as text, or empty for all restaurants. */
  restaurantId: string;
}

export const DEFAULT_FILTERS: ActivityFilters = {
  from: "",
  to: "",
  groupBy: "day",
  metric: "messages",
  restaurantId: "",
};

export interface UserActivitySummary {
  range: { from: string; to: string };
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  newUsers: number;
  usersWithLastLoginInRange: number;
  neverLoggedIn: number;
  dormantUsers: number;
  chatMessages: number;
  unreadChatMessages: number;
  activeChatters: number;
  newFriendships: number;
  approvedFriendships: number;
  ordersHandled: number;
  activeEmployees: number;
}

export interface SignupPoint {
  period: string;
  newUsers: number;
}

export interface ChatActivityPoint {
  period: string;
  messages: number;
  activeSenders: number;
}

export interface UsersByRoleEntry {
  role: string;
  users: number;
  activeUsers: number;
}

export interface TopActiveUserEntry {
  userId: number;
  name: string;
  value: number;
  revenue: number | null;
}

export interface Insight {
  key: string;
  level: "positive" | "warning" | "info";
  message: string;
  data: Record<string, number | string | null>;
}

export interface InsightsReport {
  range: { from: string; to: string };
  insights: Insight[];
}

export interface UserActivityData {
  summary: UserActivitySummary;
  signups: SignupPoint[];
  chat: ChatActivityPoint[];
  roles: UsersByRoleEntry[];
  top: TopActiveUserEntry[];
  insights: InsightsReport;
}

/** Positive integer or null; anything else is not sent to the API. */
export function parseRestaurantId(value: string): number | null {
  return /^[1-9]\d{0,8}$/.test(value.trim()) ? Number(value.trim()) : null;
}

/** Returns an error key when the filters cannot be sent, or null when valid. */
export function validateFilters(
  filters: ActivityFilters,
): "range" | "restaurant" | null {
  if (filters.from && filters.to && filters.from > filters.to) return "range";
  if (
    filters.restaurantId.trim() &&
    parseRestaurantId(filters.restaurantId) === null
  )
    return "restaurant";
  return null;
}

export function buildQuery(
  filters: ActivityFilters,
  extra: Record<string, string> = {},
): string {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const restaurantId = parseRestaurantId(filters.restaurantId);
  if (restaurantId !== null) params.set("restaurantId", String(restaurantId));
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function exportUrl(
  report: ExportReport,
  format: "csv" | "pdf",
  filters: ActivityFilters,
): string {
  return `/api/user-activity/export/${format}${buildQuery(filters, {
    report,
    groupBy: filters.groupBy,
    metric: filters.metric,
  })}`;
}

function invalid(): never {
  throw new ApiError(502, "Invalid API response");
}

function asArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) invalid();
  return value as T[];
}

function asSummary(value: unknown): UserActivitySummary {
  if (
    !value ||
    typeof value !== "object" ||
    typeof (value as UserActivitySummary).totalUsers !== "number" ||
    typeof (value as UserActivitySummary).chatMessages !== "number"
  )
    invalid();
  return value as UserActivitySummary;
}

function asInsights(value: unknown): InsightsReport {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as InsightsReport).insights)
  )
    invalid();
  return value as InsightsReport;
}

export async function fetchUserActivity(
  filters: ActivityFilters,
  signal?: AbortSignal,
): Promise<UserActivityData> {
  const base = buildQuery(filters);
  const series = buildQuery(filters, { groupBy: filters.groupBy });
  const top = buildQuery(filters, { metric: filters.metric, limit: "10" });
  const [summary, signups, chat, roles, topUsers, insights] = await Promise.all(
    [
      request<unknown>(`user-activity/summary${base}`, { signal }),
      request<unknown>(`user-activity/signups-over-time${series}`, { signal }),
      request<unknown>(`user-activity/chat-activity-over-time${series}`, {
        signal,
      }),
      request<unknown>(`user-activity/users-by-role${base}`, { signal }),
      request<unknown>(`user-activity/top-active-users${top}`, { signal }),
      request<unknown>(`user-activity/insights${base}`, { signal }),
    ],
  );
  return {
    summary: asSummary(summary),
    signups: asArray<SignupPoint>(signups),
    chat: asArray<ChatActivityPoint>(chat),
    roles: asArray<UsersByRoleEntry>(roles),
    top: asArray<TopActiveUserEntry>(topUsers),
    insights: asInsights(insights),
  };
}
