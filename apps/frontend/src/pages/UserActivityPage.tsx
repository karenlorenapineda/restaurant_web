import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { demoMode, errorMessage } from "../api/client";
import {
  DEFAULT_FILTERS,
  exportUrl,
  fetchUserActivity,
  validateFilters,
} from "../api/userActivity";
import type {
  ActivityFilters,
  ExportReport,
  GroupBy,
  TopMetric,
  UserActivityData,
} from "../api/userActivity";
import { Button, Input, Select } from "../components/ui/controls";
import {
  BarList,
  DonutChart,
  LineChart,
  formatPeriod,
} from "../features/user-activity/charts";
import { Field, Metric, Panel } from "../features/employee-panel/shared";
import { useLocale } from "../i18n";
import { USER_ACTIVITY_COPY, insightText } from "../userActivityCopy";

type Status =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; data: UserActivityData };

const REPORTS: ExportReport[] = [
  "summary",
  "signups-over-time",
  "chat-activity-over-time",
  "users-by-role",
  "top-active-users",
  "insights",
];

const number = (value: number) => new Intl.NumberFormat("es-ES").format(value);

export function UserActivityPage() {
  const locale = useLocale();
  const copy = USER_ACTIVITY_COPY[locale];
  const [draft, setDraft] = useState<ActivityFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<ActivityFilters>(DEFAULT_FILTERS);
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ state: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [report, setReport] = useState<ExportReport>("summary");
  const demo = demoMode();

  useEffect(() => {
    if (demo) return;
    const controller = new AbortController();
    setStatus({ state: "loading" });
    fetchUserActivity(applied, controller.signal)
      .then((data) => setStatus({ state: "ready", data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setStatus({ state: "error", message: errorMessage(error) });
      });
    return () => controller.abort();
  }, [applied, reloadKey, demo]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const problem = validateFilters(draft);
    if (problem) {
      setFormError(
        problem === "range" ? copy.invalidRange : copy.invalidRestaurant,
      );
      return;
    }
    setFormError(null);
    setApplied(draft);
  }

  function reset() {
    setDraft(DEFAULT_FILTERS);
    setApplied(DEFAULT_FILTERS);
    setFormError(null);
  }

  return (
    <section className="min-h-screen bg-[#242424] px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
      <div className="mx-auto grid max-w-6xl gap-7">
        <header>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
            {copy.subtitle}
          </p>
        </header>

        {demo ? (
          <Panel>
            <p role="status">{copy.demo}</p>
          </Panel>
        ) : (
          <>
            <Panel>
              <form onSubmit={submit} noValidate aria-label={copy.filters}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <Field label={copy.from}>
                    <Input
                      type="date"
                      value={draft.from}
                      onChange={(event) =>
                        setDraft({ ...draft, from: event.target.value })
                      }
                    />
                  </Field>
                  <Field label={copy.to}>
                    <Input
                      type="date"
                      value={draft.to}
                      onChange={(event) =>
                        setDraft({ ...draft, to: event.target.value })
                      }
                    />
                  </Field>
                  <Field label={copy.groupBy}>
                    <Select
                      value={draft.groupBy}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          groupBy: event.target.value as GroupBy,
                        })
                      }
                    >
                      <option value="day">{copy.day}</option>
                      <option value="week">{copy.week}</option>
                      <option value="month">{copy.month}</option>
                    </Select>
                  </Field>
                  <Field label={copy.metric}>
                    <Select
                      value={draft.metric}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          metric: event.target.value as TopMetric,
                        })
                      }
                    >
                      <option value="messages">{copy.messages}</option>
                      <option value="orders">{copy.orders}</option>
                    </Select>
                  </Field>
                  <Field label={copy.restaurant}>
                    <Input
                      inputMode="numeric"
                      placeholder={copy.restaurantPlaceholder}
                      value={draft.restaurantId}
                      onChange={(event) =>
                        setDraft({ ...draft, restaurantId: event.target.value })
                      }
                    />
                  </Field>
                </div>
                {formError && (
                  <p
                    role="alert"
                    className="mt-4 text-sm text-[var(--ui-danger)]"
                  >
                    {formError}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button type="submit" loading={status.state === "loading"}>
                    {copy.apply}
                  </Button>
                  <Button type="button" variant="secondary" onClick={reset}>
                    {copy.reset}
                  </Button>
                </div>
              </form>
            </Panel>

            {status.state === "loading" && (
              <p role="status" className="text-zinc-300">
                {copy.loading}
              </p>
            )}

            {status.state === "error" && (
              <Panel>
                <p role="alert" className="text-[var(--ui-danger)]">
                  {copy.error}: {status.message}
                </p>
                <Button
                  className="mt-4"
                  variant="secondary"
                  onClick={() => setReloadKey((key) => key + 1)}
                >
                  {copy.retry}
                </Button>
              </Panel>
            )}

            {status.state === "ready" && (
              <Dashboard
                data={status.data}
                filters={applied}
                report={report}
                onReport={setReport}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}

function Dashboard({
  data,
  filters,
  report,
  onReport,
}: {
  data: UserActivityData;
  filters: ActivityFilters;
  report: ExportReport;
  onReport: (report: ExportReport) => void;
}) {
  const locale = useLocale();
  const copy = USER_ACTIVITY_COPY[locale];
  const { summary } = data;
  const range = `${summary.range.from.slice(0, 10)} → ${summary.range.to.slice(0, 10)}`;

  return (
    <>
      <p className="text-sm text-zinc-400">
        {copy.period}: {range} (UTC)
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label={copy.kpiTotalUsers} value={number(summary.totalUsers)} />
        <Metric
          label={copy.kpiActiveUsers}
          value={number(summary.activeUsers)}
        />
        <Metric label={copy.kpiNewUsers} value={number(summary.newUsers)} />
        <Metric label={copy.kpiDormant} value={number(summary.dormantUsers)} />
        <Metric
          label={copy.kpiVerified}
          value={number(summary.verifiedUsers)}
        />
        <Metric
          label={copy.kpiNeverLoggedIn}
          value={number(summary.neverLoggedIn)}
        />
        <Metric label={copy.kpiMessages} value={number(summary.chatMessages)} />
        <Metric
          label={copy.kpiChatters}
          value={number(summary.activeChatters)}
        />
        <Metric
          label={copy.kpiUnread}
          value={number(summary.unreadChatMessages)}
        />
        <Metric
          label={copy.kpiFriendships}
          value={number(summary.newFriendships)}
        />
        <Metric
          label={copy.kpiOrdersHandled}
          value={number(summary.ordersHandled)}
        />
        <Metric
          label={copy.kpiEmployees}
          value={number(summary.activeEmployees)}
        />
      </div>

      <Panel>
        <h2 className="font-display text-2xl font-bold">{copy.insights}</h2>
        {data.insights.insights.length === 0 ? (
          <p className="mt-3 text-zinc-400">{copy.noInsights}</p>
        ) : (
          <ul className="mt-4 grid list-none gap-3 p-0">
            {data.insights.insights.map((insight) => (
              <li
                key={insight.key}
                data-level={insight.level}
                className={`rounded-sm border-l-4 bg-zinc-900 px-4 py-3 ${
                  insight.level === "positive"
                    ? "border-green-400"
                    : insight.level === "warning"
                      ? "border-[#e8b45f]"
                      : "border-zinc-500"
                }`}
              >
                {insightText(insight, locale)}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-7 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-4 font-display text-2xl font-bold">
            {copy.signupsChart}
          </h2>
          <LineChart
            title={copy.signupsChart}
            emptyText={copy.noData}
            points={data.signups.map((point) => ({
              label: formatPeriod(point.period, filters.groupBy),
              value: point.newUsers,
            }))}
          />
        </Panel>
        <Panel>
          <h2 className="mb-4 font-display text-2xl font-bold">
            {copy.chatChart}
          </h2>
          <LineChart
            title={copy.chatChart}
            emptyText={copy.noData}
            color="#7dd3fc"
            points={data.chat.map((point) => ({
              label: formatPeriod(point.period, filters.groupBy),
              value: point.messages,
            }))}
          />
        </Panel>
        <Panel>
          <h2 className="mb-4 font-display text-2xl font-bold">
            {copy.rolesChart}
          </h2>
          <DonutChart
            title={copy.rolesChart}
            emptyText={copy.noData}
            slices={data.roles.map((role) => ({
              label: role.role,
              value: role.users,
            }))}
          />
        </Panel>
        <Panel>
          <h2 className="mb-4 font-display text-2xl font-bold">
            {copy.topChart}
          </h2>
          <BarList
            emptyText={copy.noData}
            rows={data.top.map((user) => ({
              label: user.name,
              value: user.value,
              ...(user.revenue !== null
                ? { detail: `${number(user.revenue)} ${copy.revenue}` }
                : {}),
            }))}
          />
        </Panel>
      </div>

      <Panel>
        <h2 className="font-display text-2xl font-bold">{copy.export}</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Field label={copy.exportReport}>
            <Select
              value={report}
              onChange={(event) => onReport(event.target.value as ExportReport)}
            >
              {REPORTS.map((value) => (
                <option key={value} value={value}>
                  {copy.reports[value]}
                </option>
              ))}
            </Select>
          </Field>
          <a
            className="ui-button ui-button--primary"
            href={exportUrl(report, "csv", filters)}
            download
          >
            {copy.exportCsv}
          </a>
          <a
            className="ui-button ui-button--secondary"
            href={exportUrl(report, "pdf", filters)}
            download
          >
            {copy.exportPdf}
          </a>
        </div>
        <p className="mt-4 text-sm text-zinc-400">{copy.note}</p>
      </Panel>
    </>
  );
}
