/**
 * Minimal, dependency-free CSV serializer. Good enough for tabular
 * analytics reports (numbers, dates and short strings) without pulling
 * in an extra package just for comma-separated values.
 */
const FORMULA_START = /^\s*[=+\-@]|^[\t\r]/;

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let raw = value instanceof Date ? value.toISOString() : String(value);

  // CSV/formula injection: Excel and LibreOffice run a text cell that starts
  // with = + - @ (or a tab / carriage return) as a formula. Text is prefixed
  // with a single quote so it is shown as plain text. Real numbers are left
  // alone so negative amounts keep working.
  if (typeof value === "string" && FORMULA_START.test(raw)) {
    raw = `'${raw}`;
  }

  const needsQuoting = /[",\n\r]/.test(raw);

  if (!needsQuoting) {
    return raw;
  }

  return `"${raw.replace(/"/g, '""')}"`;
}

export function toCsv<T>(
  rows: T[],
  columns: { key: keyof T; header: string }[],
): string {
  const headerLine = columns.map((column) => escapeCsvCell(column.header));
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsvCell(row[column.key])),
  );

  return [headerLine, ...lines].map((line) => line.join(",")).join("\r\n");
}
