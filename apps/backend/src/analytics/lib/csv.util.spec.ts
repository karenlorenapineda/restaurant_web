import { toCsv } from "./csv.util";

const columns = [{ key: "name" as const, header: "Name" }];

function firstCell(value: unknown): string {
  return toCsv([{ name: value }], columns).split("\r\n")[1] ?? "";
}

describe("toCsv", () => {
  it.each(["=1+1", "+1+1", "-2+3", "@SUM(A1)", "\t=1+1", "\r=1+1", "  =cmd"])(
    "prefixes a text cell that starts like a formula: %j",
    (value) => {
      expect(firstCell(value).replace(/^"/, "").startsWith("'")).toBe(true);
    },
  );

  it("does not touch normal text, dates or numbers (negatives included)", () => {
    expect(firstCell("Paella valenciana")).toBe("Paella valenciana");
    expect(firstCell("2026-08-31T00:00:00.000Z")).toBe("2026-08-31T00:00:00.000Z");
    expect(firstCell(12.5)).toBe("12.5");
    expect(firstCell(-12.5)).toBe("-12.5");
    expect(firstCell(new Date("2026-08-31T00:00:00Z"))).toBe(
      "2026-08-31T00:00:00.000Z",
    );
    expect(firstCell(null)).toBe("");
  });

  it("keeps quoting commas and quotes after protecting the cell", () => {
    expect(firstCell('=HYPERLINK("x","y")')).toBe(`"'=HYPERLINK(""x"",""y"")"`);
    expect(firstCell("Tarta, de queso")).toBe('"Tarta, de queso"');
  });

  it("protects headers too", () => {
    expect(toCsv([], [{ key: "x" as never, header: "=bad" }])).toBe("'=bad");
  });
});
