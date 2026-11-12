import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setLocale } from "../i18n";
import { UserActivityPage } from "./UserActivityPage";

const summary = {
  range: { from: "2026-08-01T00:00:00.000Z", to: "2026-08-31T23:59:59.999Z" },
  totalUsers: 40,
  activeUsers: 38,
  verifiedUsers: 35,
  newUsers: 12,
  usersWithLastLoginInRange: 20,
  neverLoggedIn: 6,
  dormantUsers: 7,
  chatMessages: 120,
  unreadChatMessages: 30,
  activeChatters: 15,
  newFriendships: 4,
  approvedFriendships: 3,
  ordersHandled: 9,
  activeEmployees: 3,
};

function answer(url: string): unknown {
  if (url.includes("user-activity/summary")) return summary;
  if (url.includes("signups-over-time"))
    return [
      { period: "2026-08-01T00:00:00.000Z", newUsers: 2 },
      { period: "2026-08-02T00:00:00.000Z", newUsers: 5 },
    ];
  if (url.includes("chat-activity-over-time"))
    return [
      { period: "2026-08-01T00:00:00.000Z", messages: 9, activeSenders: 3 },
    ];
  if (url.includes("users-by-role"))
    return [
      { role: "customer", users: 30, activeUsers: 29 },
      { role: "employee", users: 10, activeUsers: 9 },
    ];
  if (url.includes("top-active-users"))
    return [{ userId: 1, name: "Ana Pons", value: 50, revenue: null }];
  if (url.includes("user-activity/insights"))
    return {
      range: summary.range,
      insights: [
        {
          key: "signups_trend",
          level: "positive",
          message: "English fallback",
          data: { current: 12, previous: 8, changePercent: 50 },
        },
        {
          key: "dormant_users",
          level: "info",
          message: "x",
          data: { dormantUsers: 7, activeUsers: 38, sharePercent: 18.4 },
        },
      ],
    };
  throw new Error(`unexpected ${url}`);
}

function mockFetch(
  overrides: (url: string) => Response | undefined = () => undefined,
) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    return (
      overrides(url) ??
      new Response(JSON.stringify(answer(url)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const urls = (fetchMock: ReturnType<typeof mockFetch>) =>
  fetchMock.mock.calls.map(([input]) => String(input));

beforeEach(() => {
  setLocale("es");
  vi.stubEnv("VITE_DATA_MODE", "api");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("UserActivityPage", () => {
  it("does not call the API in demo mode and says so", () => {
    vi.stubEnv("VITE_DATA_MODE", "demo");
    const fetchMock = mockFetch();

    render(<UserActivityPage />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "necesita la API real",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads the six reports and shows KPIs, charts and translated insights", async () => {
    const fetchMock = mockFetch();

    render(<UserActivityPage />);

    expect(await screen.findByText("Usuarios totales")).toBeInTheDocument();
    expect(
      screen.getByText("Usuarios más activos", { selector: "h2" }),
    ).toBeInTheDocument();
    expect(urls(fetchMock)).toHaveLength(6);
    expect(
      screen.getByRole("img", {
        name: /Altas de usuarios: 2026-08-01 2, 2026-08-02 5/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /Usuarios por rol: customer 30, employee 10/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ana Pons")).toBeInTheDocument();
    expect(screen.getByText(/Las altas nuevas suben 50%/)).toBeInTheDocument();
    expect(
      screen.getByText(/7 de 38 usuarios activos \(18.4%\)/),
    ).toBeInTheDocument();
    expect(screen.queryByText("English fallback")).not.toBeInTheDocument();
  });

  it("translates insights into English when the language changes", async () => {
    setLocale("en");
    mockFetch();

    render(<UserActivityPage />);

    expect(
      await screen.findByText(/New sign-ups are up 50%/),
    ).toBeInTheDocument();
  });

  it("sends the chosen filters to every request", async () => {
    const fetchMock = mockFetch();
    render(<UserActivityPage />);
    await screen.findByText("Usuarios totales");

    fireEvent.change(screen.getByLabelText("Desde"), {
      target: { value: "2026-08-01" },
    });
    fireEvent.change(screen.getByLabelText("Hasta"), {
      target: { value: "2026-08-31" },
    });
    fireEvent.change(screen.getByLabelText("Agrupar por"), {
      target: { value: "month" },
    });
    fireEvent.change(screen.getByLabelText("Ranking por"), {
      target: { value: "orders" },
    });
    fireEvent.change(screen.getByLabelText("Restaurante (ID)"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(urls(fetchMock)).toHaveLength(12));
    const second = urls(fetchMock).slice(6);
    expect(
      second.every((url) =>
        url.includes("from=2026-08-01&to=2026-08-31&restaurantId=2"),
      ),
    ).toBe(true);
    expect(second.find((url) => url.includes("signups-over-time"))).toContain(
      "groupBy=month",
    );
    expect(second.find((url) => url.includes("top-active-users"))).toContain(
      "metric=orders",
    );
  });

  it("rejects an inverted date range without calling the API", async () => {
    const fetchMock = mockFetch();
    render(<UserActivityPage />);
    await screen.findByText("Usuarios totales");

    fireEvent.change(screen.getByLabelText("Desde"), {
      target: { value: "2026-09-01" },
    });
    fireEvent.change(screen.getByLabelText("Hasta"), {
      target: { value: "2026-08-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "no puede ser posterior",
    );
    expect(urls(fetchMock)).toHaveLength(6);
  });

  it("rejects a restaurant ID that is not a positive integer", async () => {
    const fetchMock = mockFetch();
    render(<UserActivityPage />);
    await screen.findByText("Usuarios totales");

    fireEvent.change(screen.getByLabelText("Restaurante (ID)"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.getByRole("alert")).toHaveTextContent("entero positivo");
    expect(urls(fetchMock)).toHaveLength(6);
  });

  it("shows the API error and retries", async () => {
    let fail = true;
    const fetchMock = mockFetch((url) =>
      fail && url.includes("user-activity/summary")
        ? new Response(JSON.stringify({ message: "Boom" }), { status: 500 })
        : undefined,
    );

    render(<UserActivityPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudieron cargar los datos: Boom",
    );

    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Usuarios totales")).toBeInTheDocument();
    expect(urls(fetchMock).length).toBeGreaterThan(6);
  });

  it("rejects a malformed response instead of drawing it", async () => {
    mockFetch((url) =>
      url.includes("users-by-role")
        ? new Response(JSON.stringify({ oops: true }), { status: 200 })
        : undefined,
    );

    render(<UserActivityPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid API response",
    );
  });

  it("builds the export links from the applied filters and chosen report", async () => {
    mockFetch();
    render(<UserActivityPage />);
    await screen.findByText("Usuarios totales");

    fireEvent.change(screen.getByLabelText("Informe"), {
      target: { value: "top-active-users" },
    });

    const csv = screen.getByRole("link", { name: "CSV" });
    const pdf = screen.getByRole("link", { name: "PDF" });
    expect(csv).toHaveAttribute(
      "href",
      expect.stringContaining("/api/user-activity/export/csv?"),
    );
    expect(csv.getAttribute("href")).toContain("report=top-active-users");
    expect(pdf.getAttribute("href")).toContain("/export/pdf?");
  });
});
