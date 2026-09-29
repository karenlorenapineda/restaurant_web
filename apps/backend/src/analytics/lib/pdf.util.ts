import PDFDocument from "pdfkit";

export interface PdfKpi {
  label: string;
  value: string;
}

export interface PdfTableColumn {
  header: string;
  width: number;
}

export interface PdfReportOptions {
  title: string;
  subtitle: string;
  kpis?: PdfKpi[];
  table?: {
    columns: PdfTableColumn[];
    rows: string[][];
  };
}

/**
 * Renders a simple, text/table-based PDF report (title, date range, optional
 * KPI cards and a data table). This intentionally does not attempt to
 * rasterize charts server-side (that would need a headless browser or a
 * native canvas dependency); the frontend renders the interactive charts
 * from the JSON endpoints, and this PDF is the "take it with you" summary.
 */
export function buildPdfReport(options: PdfReportOptions): Promise<Buffer> {
  const { title, subtitle, kpis, table } = options;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text(title, { align: "left" });
    doc.moveDown(0.25);
    doc.fontSize(10).fillColor("#555555").text(subtitle);
    doc.fillColor("#000000");
    doc.moveDown(1);

    if (kpis && kpis.length > 0) {
      const kpiWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / kpis.length;
      const startY = doc.y;

      kpis.forEach((kpi, index) => {
        const x = doc.page.margins.left + index * kpiWidth;
        doc
          .fontSize(9)
          .fillColor("#555555")
          .text(kpi.label.toUpperCase(), x, startY, { width: kpiWidth - 10 });
        doc
          .fontSize(16)
          .fillColor("#000000")
          .text(kpi.value, x, startY + 14, { width: kpiWidth - 10 });
      });

      doc.y = startY + 50;
      doc.moveDown(1);
    }

    if (table && table.rows.length > 0) {
      const { columns, rows } = table;
      const rowHeight = 20;
      let y = doc.y;

      doc.fontSize(10).fillColor("#ffffff");
      doc.rect(doc.page.margins.left, y, columns.reduce((sum, c) => sum + c.width, 0), rowHeight).fill("#2d2d2d");
      doc.fillColor("#ffffff");

      let x = doc.page.margins.left;
      columns.forEach((column) => {
        doc.text(column.header, x + 4, y + 6, { width: column.width - 8 });
        x += column.width;
      });

      y += rowHeight;
      doc.fillColor("#000000");

      rows.forEach((row, rowIndex) => {
        if (y > doc.page.height - doc.page.margins.bottom - rowHeight) {
          doc.addPage();
          y = doc.page.margins.top;
        }

        if (rowIndex % 2 === 0) {
          doc
            .rect(doc.page.margins.left, y, columns.reduce((sum, c) => sum + c.width, 0), rowHeight)
            .fill("#f5f5f5");
          doc.fillColor("#000000");
        }

        let cellX = doc.page.margins.left;
        doc.fontSize(9).fillColor("#000000");
        row.forEach((cell, columnIndex) => {
          const column = columns[columnIndex];
          if (!column) {
            return;
          }
          doc.text(cell, cellX + 4, y + 5, { width: column.width - 8 });
          cellX += column.width;
        });

        y += rowHeight;
      });

      doc.y = y;
    } else if (table) {
      doc.fontSize(10).fillColor("#555555").text("No data available for the selected filters.");
    }

    doc.end();
  });
}
