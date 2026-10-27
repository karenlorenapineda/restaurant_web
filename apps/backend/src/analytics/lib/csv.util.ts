/**
 * Minimal, dependency-free CSV serializer. Good enough for tabular
 * analytics reports (numbers, dates and short strings) without pulling
 * in an extra package just for comma-separated values.
 */
function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const raw = value instanceof Date ? value.toISOString() : String(value);
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
