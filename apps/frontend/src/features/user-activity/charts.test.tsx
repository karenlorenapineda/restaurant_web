import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  buildQuery,
  exportUrl,
  parseRestaurantId,
  validateFilters,
  DEFAULT_FILTERS,
} from "../../api/userActivity";
import { getPageFromPath } from "../../navigation";
import { insightText } from "../../userActivityCopy";
import {
  BarList,
  DonutChart,
  LineChart,
  formatPeriod,
  niceMax,
} from "./charts";

describe("chart helpers", () => {
  it("rounds axis maxima up to a readable value", () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(-4)).toBe(1);
    expect(niceMax(Number.NaN)).toBe(1);
    expect(niceMax(1)).toBe(1);
    expect(niceMax(3)).toBe(5);
    expect(niceMax(7)).toBe(10);
    expect(niceMax(130)).toBe(200);
  });

  it("formats bucket labels by grouping", () => {
    expect(formatPeriod("2026-08-01T00:00:00.000Z", "day")).toBe("2026-08-01");
    expect(formatPeriod("2026-08-03T00:00:00.000Z", "week")).toBe("2026-08-03");
    expect(formatPeriod("2026-08-01T00:00:00.000Z", "month")).toBe("2026-08");
  });
});

describe("charts", () => {
  it("shows the empty text instead of an empty chart", () => {
    render(
      <>
        <LineChart points={[]} title="t" emptyText="vacío-línea" />
        <BarList rows={[]} emptyText="vacío-barras" />
        <DonutChart slices={[]} title="t" emptyText="vacío-donut" />
        <DonutChart
          slices={[{ label: "a", value: 0 }]}
          title="t"
          emptyText="vacío-ceros"
        />
      </>,
    );
    for (const text of [
      "vacío-línea",
      "vacío-barras",
      "vacío-donut",
      "vacío-ceros",
    ])
      expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("draws a line chart with one point and with all zeros without NaN", () => {
    const { container } = render(
      <>
        <LineChart
          points={[{ label: "a", value: 4 }]}
          title="uno"
          emptyText="x"
        />
        <LineChart
          points={[
            { label: "a", value: 0 },
            { label: "b", value: 0 },
          ]}
          title="ceros"
          emptyText="x"
        />
      </>,
    );
    expect(container.innerHTML).not.toContain("NaN");
    expect(screen.getByRole("img", { name: "uno: a 4" })).toBeInTheDocument();
  });

  it("draws bars in proportion to the largest value", () => {
    const { container } = render(
      <BarList
        emptyText="x"
        rows={[
          { label: "A", value: 10 },
          { label: "B", value: 5, detail: "d" },
        ]}
      />,
    );
    const widths = Array.from(
      container.querySelectorAll<HTMLElement>("div[style]"),
    ).map((bar) => bar.style.width);
    expect(widths).toEqual(["100%", "50%"]);
    expect(screen.getByText("d")).toBeInTheDocument();
  });

  it("draws one donut segment per slice and a legend", () => {
    const { container } = render(
      <DonutChart
        title="roles"
        emptyText="x"
        slices={[
          { label: "a", value: 3 },
          { label: "b", value: 1 },
        ]}
      />,
    );
    expect(container.querySelectorAll("circle")).toHaveLength(2);
    // Each segment starts where the previous one ended (3/4 and 1/4 of the ring).
    const [first, second] = Array.from(container.querySelectorAll("circle"));
    const circumference = 2 * Math.PI * 52;
    expect(Number(first?.getAttribute("stroke-dashoffset"))).toBeCloseTo(0);
    expect(Number(second?.getAttribute("stroke-dashoffset"))).toBeCloseTo(
      -0.75 * circumference,
    );
    expect(
      screen.getByRole("img", { name: "roles: a 3, b 1" }),
    ).toBeInTheDocument();
  });
});

describe("filters and URLs", () => {
  it("accepts only positive integers as restaurant ID", () => {
    expect(parseRestaurantId("3")).toBe(3);
    expect(parseRestaurantId(" 12 ")).toBe(12);
    for (const bad of ["0", "-1", "1.5", "abc", "1e3", "0123", ""])
      expect(parseRestaurantId(bad)).toBeNull();
  });

  it("validates range and restaurant", () => {
    expect(validateFilters(DEFAULT_FILTERS)).toBeNull();
    expect(
      validateFilters({
        ...DEFAULT_FILTERS,
        from: "2026-02-02",
        to: "2026-02-01",
      }),
    ).toBe("range");
    expect(
      validateFilters({
        ...DEFAULT_FILTERS,
        from: "2026-02-01",
        to: "2026-02-01",
      }),
    ).toBeNull();
    expect(validateFilters({ ...DEFAULT_FILTERS, restaurantId: "x" })).toBe(
      "restaurant",
    );
  });

  it("omits empty filters and encodes the rest", () => {
    expect(buildQuery(DEFAULT_FILTERS)).toBe("");
    expect(
      buildQuery(
        { ...DEFAULT_FILTERS, from: "2026-08-01", restaurantId: "2" },
        { a: "b c" },
      ),
    ).toBe("?from=2026-08-01&restaurantId=2&a=b+c");
    expect(exportUrl("insights", "pdf", DEFAULT_FILTERS)).toBe(
      "/api/user-activity/export/pdf?report=insights&groupBy=day&metric=messages",
    );
  });
});

describe("insightText", () => {
  const base = { message: "English fallback", data: {} };

  it("falls back to the API message for unknown keys", () => {
    expect(
      insightText({ ...base, key: "new_thing", level: "info" }, "es"),
    ).toBe("English fallback");
  });

  it("handles a missing baseline in each language", () => {
    const insight = {
      ...base,
      key: "chat_trend",
      level: "info" as const,
      data: { current: 5, previous: 0, changePercent: null },
    };
    expect(insightText(insight, "es")).toContain("ninguna en el anterior");
    expect(insightText(insight, "en")).toContain("none in the previous one");
    expect(insightText(insight, "pt")).toContain("nenhuma no anterior");
  });

  it("names the weekday in the chosen language", () => {
    const insight = {
      ...base,
      key: "peak_chat_time",
      level: "info" as const,
      data: { weekday: "Monday", hourUtc: 8 },
    };
    expect(insightText(insight, "es")).toContain("lunes");
    expect(insightText(insight, "es")).toContain("08:00 UTC");
    expect(insightText(insight, "pt")).toContain("segundas");
  });
});

describe("navigation", () => {
  it("routes /actividad to the user activity page", () => {
    window.history.replaceState({}, "", "/actividad");
    expect(getPageFromPath()).toBe("user-activity");
    window.history.replaceState({}, "", "/");
    expect(getPageFromPath()).toBe("home");
  });
});
