import type { GroupBy } from "../../api/userActivity";

/** Charts drawn with plain SVG: no chart library is needed. */

export const CHART_COLORS = [
  "#e8b45f",
  "#7dd3fc",
  "#86efac",
  "#f9a8d4",
  "#c4b5fd",
  "#fdba74",
];

/** Rounds the top of an axis up to 1, 2, 5 or 10 times a power of ten. */
export function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const fraction = value / power;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * power;
}

/** Short label for a bucket start (UTC), enough to tell buckets apart. */
export function formatPeriod(iso: string, groupBy: GroupBy): string {
  return groupBy === "month" ? iso.slice(0, 7) : iso.slice(0, 10);
}

export interface SeriesPoint {
  label: string;
  value: number;
}

const WIDTH = 640;
const HEIGHT = 260;
const MARGIN = { top: 16, right: 16, bottom: 36, left: 44 };

export function LineChart({
  points,
  title,
  color = CHART_COLORS[0]!,
  emptyText,
}: {
  points: SeriesPoint[];
  title: string;
  color?: string;
  emptyText: string;
}) {
  if (points.length === 0) return <p className="text-zinc-400">{emptyText}</p>;

  const max = niceMax(Math.max(...points.map((point) => point.value)));
  const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const x = (index: number) =>
    MARGIN.left +
    (points.length === 1
      ? innerWidth / 2
      : (index / (points.length - 1)) * innerWidth);
  const y = (value: number) =>
    MARGIN.top + innerHeight - (value / max) * innerHeight;
  const path = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${x(index)},${y(point.value)}`,
    )
    .join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => fraction * max);
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${title}: ${points
          .map((point) => `${point.label} ${point.value}`)
          .join(", ")}`}
        className="h-auto w-full"
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="#ffffff1a"
            />
            <text
              x={MARGIN.left - 8}
              y={y(tick) + 4}
              textAnchor="end"
              fontSize="11"
              fill="#a1a1aa"
            >
              {Number.isInteger(tick) ? tick : tick.toFixed(1)}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" />
        {points.map((point, index) => (
          <g key={point.label}>
            <circle cx={x(index)} cy={y(point.value)} r="3.5" fill={color}>
              <title>{`${point.label}: ${point.value}`}</title>
            </circle>
            {index % labelEvery === 0 && (
              <text
                x={x(index)}
                y={HEIGHT - 12}
                textAnchor="middle"
                fontSize="11"
                fill="#a1a1aa"
              >
                {point.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </figure>
  );
}

export function BarList({
  rows,
  emptyText,
  format = (value: number) => String(value),
}: {
  rows: { label: string; value: number; detail?: string }[];
  emptyText: string;
  format?: (value: number) => string;
}) {
  if (rows.length === 0) return <p className="text-zinc-400">{emptyText}</p>;
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <ol className="m-0 grid list-none gap-3 p-0">
      {rows.map((row, index) => (
        <li key={`${row.label}-${index}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{row.label}</span>
            <span className="shrink-0 font-bold text-[#e8b45f]">
              {format(row.value)}
              {row.detail ? (
                <span className="ml-2 font-normal text-zinc-400">
                  {row.detail}
                </span>
              ) : null}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-sm bg-zinc-800" role="presentation">
            <div
              className="h-2 rounded-sm bg-[#e8b45f]"
              style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DonutChart({
  slices,
  title,
  emptyText,
}: {
  slices: { label: string; value: number }[];
  title: string;
  emptyText: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (slices.length === 0 || total === 0)
    return <p className="text-zinc-400">{emptyText}</p>;

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg
        viewBox="0 0 140 140"
        role="img"
        aria-label={`${title}: ${slices
          .map((slice) => `${slice.label} ${slice.value}`)
          .join(", ")}`}
        className="h-40 w-40 shrink-0"
      >
        <g transform="rotate(-90 70 70)">
          {slices.map((slice, index) => {
            const length = (slice.value / total) * circumference;
            const circle = (
              <circle
                key={slice.label}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth="22"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
              >
                <title>{`${slice.label}: ${slice.value}`}</title>
              </circle>
            );
            offset += length;
            return circle;
          })}
        </g>
        <text
          x="70"
          y="76"
          textAnchor="middle"
          fontSize="20"
          fontWeight="700"
          fill="#fafafa"
        >
          {total}
        </text>
      </svg>
      <ul className="m-0 grid list-none gap-2 p-0 text-sm">
        {slices.map((slice, index) => (
          <li key={slice.label} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span>{slice.label}</span>
            <span className="font-bold text-[#e8b45f]">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
