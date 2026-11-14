export type InsightLevel = "positive" | "warning" | "info";

export interface Insight {
  /** Stable id so a frontend can translate or style it. */
  key: string;
  level: InsightLevel;
  message: string;
  data: Record<string, number | string | null>;
}

export interface InsightInput {
  newUsers: number;
  previousNewUsers: number;
  chatMessages: number;
  previousChatMessages: number;
  activeUsers: number;
  dormantUsers: number;
  unreadMessages: number;
  /** 0 = Sunday ... 6 = Saturday (UTC), null when there are no messages. */
  peakWeekday: number | null;
  /** 0-23 (UTC), null when there are no messages. */
  peakHour: number | null;
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Change in percent, rounded to 1 decimal. null when there is no baseline. */
export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) {
    return null;
  }

  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function trend(
  key: string,
  label: string,
  current: number,
  previous: number,
): Insight {
  const change = percentChange(current, previous);
  const data = { current, previous, changePercent: change };

  if (change === null) {
    return {
      key,
      level: "info",
      message:
        current === 0
          ? `No ${label} in this period or in the previous one.`
          : `${current} ${label} in this period, none in the previous one.`,
      data,
    };
  }

  if (change >= 10) {
    return {
      key,
      level: "positive",
      message: `${label[0]?.toUpperCase() ?? ""}${label.slice(1)} are up ${change}% compared with the previous period (${previous} -> ${current}).`,
      data,
    };
  }

  if (change <= -10) {
    return {
      key,
      level: "warning",
      message: `${label[0]?.toUpperCase() ?? ""}${label.slice(1)} are down ${Math.abs(change)}% compared with the previous period (${previous} -> ${current}).`,
      data,
    };
  }

  return {
    key,
    level: "info",
    message: `${label[0]?.toUpperCase() ?? ""}${label.slice(1)} are stable compared with the previous period (${previous} -> ${current}).`,
    data,
  };
}

/** Turns the raw numbers into short, readable findings. Pure: easy to test. */
export function buildInsights(input: InsightInput): Insight[] {
  const insights: Insight[] = [
    trend(
      "signups_trend",
      "new sign-ups",
      input.newUsers,
      input.previousNewUsers,
    ),
    trend(
      "chat_trend",
      "chat messages",
      input.chatMessages,
      input.previousChatMessages,
    ),
  ];

  if (input.activeUsers > 0) {
    const share =
      Math.round((input.dormantUsers / input.activeUsers) * 1000) / 10;
    insights.push({
      key: "dormant_users",
      level: share >= 50 ? "warning" : "info",
      message: `${input.dormantUsers} of ${input.activeUsers} active users (${share}%) have not logged in for 30 days or never did.`,
      data: {
        dormantUsers: input.dormantUsers,
        activeUsers: input.activeUsers,
        sharePercent: share,
      },
    });
  }

  if (input.chatMessages > 0) {
    const rate =
      Math.round((input.unreadMessages / input.chatMessages) * 1000) / 10;
    insights.push({
      key: "unread_messages",
      level: rate > 30 ? "warning" : "info",
      message: `${rate}% of the chat messages sent in this period are still unread.`,
      data: {
        unreadMessages: input.unreadMessages,
        chatMessages: input.chatMessages,
        ratePercent: rate,
      },
    });
  }

  if (input.peakWeekday !== null && input.peakHour !== null) {
    const day = WEEKDAYS[input.peakWeekday] ?? "Unknown";
    insights.push({
      key: "peak_chat_time",
      level: "info",
      message: `Most chat messages are sent on ${day}s, mainly around ${String(input.peakHour).padStart(2, "0")}:00 UTC.`,
      data: { weekday: day, hourUtc: input.peakHour },
    });
  }

  return insights;
}

/** `maria.lopez@x.com` -> `ma***@x.com`: enough to recognise, not to expose. */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");

  return `${local.slice(0, 2)}***${domain ? `@${domain}` : ""}`;
}
