import {
  buildInsights,
  InsightInput,
  maskEmail,
  percentChange,
} from "./insights.util";

const base: InsightInput = {
  newUsers: 10,
  previousNewUsers: 10,
  chatMessages: 100,
  previousChatMessages: 100,
  activeUsers: 40,
  dormantUsers: 4,
  unreadMessages: 10,
  peakWeekday: 5,
  peakHour: 18,
};

const find = (input: InsightInput, key: string) =>
  buildInsights(input).find((i) => i.key === key);

describe("percentChange", () => {
  it("rounds to one decimal and has no baseline when the previous value is 0", () => {
    expect(percentChange(125, 100)).toBe(25);
    expect(percentChange(1, 3)).toBe(-66.7);
    expect(percentChange(5, 0)).toBeNull();
    expect(percentChange(0, 0)).toBeNull();
  });
});

describe("buildInsights", () => {
  it("flags a rise of 10% or more as positive and a fall as a warning", () => {
    expect(find({ ...base, newUsers: 13 }, "signups_trend")).toMatchObject({
      level: "positive",
      data: { current: 13, previous: 10, changePercent: 30 },
    });
    expect(find({ ...base, newUsers: 5 }, "signups_trend")).toMatchObject({
      level: "warning",
      data: { changePercent: -50 },
    });
  });

  it("treats a change under 10% as stable", () => {
    expect(find({ ...base, chatMessages: 105 }, "chat_trend")).toMatchObject({
      level: "info",
      message: expect.stringContaining("stable"),
    });
  });

  it("does not divide by zero when the previous period had no data", () => {
    const fromNothing = find({ ...base, previousNewUsers: 0 }, "signups_trend");
    const bothEmpty = find(
      { ...base, newUsers: 0, previousNewUsers: 0 },
      "signups_trend",
    );

    expect(fromNothing?.data.changePercent).toBeNull();
    expect(fromNothing?.message).toContain("none in the previous one");
    expect(bothEmpty?.message).toContain("No new sign-ups");
  });

  it("warns when half of the active users are dormant", () => {
    expect(find({ ...base, dormantUsers: 20 }, "dormant_users")?.level).toBe(
      "warning",
    );
    expect(find({ ...base, dormantUsers: 19 }, "dormant_users")?.level).toBe(
      "info",
    );
  });

  it("warns when more than 30% of the messages are unread", () => {
    expect(
      find({ ...base, unreadMessages: 31 }, "unread_messages")?.level,
    ).toBe("warning");
    expect(
      find({ ...base, unreadMessages: 30 }, "unread_messages")?.level,
    ).toBe("info");
  });

  it("names the busiest weekday and hour (UTC)", () => {
    expect(find(base, "peak_chat_time")).toMatchObject({
      message:
        "Most chat messages are sent on Fridays, mainly around 18:00 UTC.",
      data: { weekday: "Friday", hourUtc: 18 },
    });
  });

  it("leaves out the insights it cannot compute (no users, no messages)", () => {
    const keys = buildInsights({
      ...base,
      activeUsers: 0,
      dormantUsers: 0,
      chatMessages: 0,
      previousChatMessages: 0,
      unreadMessages: 0,
      peakWeekday: null,
      peakHour: null,
    }).map((i) => i.key);

    expect(keys).toEqual(["signups_trend", "chat_trend"]);
  });
});

describe("maskEmail", () => {
  it("keeps two characters and the domain", () => {
    expect(maskEmail("maria.lopez@picasso.com")).toBe("ma***@picasso.com");
    expect(maskEmail("a@x.es")).toBe("a***@x.es");
    expect(maskEmail("sinarroba")).toBe("si***");
  });
});
