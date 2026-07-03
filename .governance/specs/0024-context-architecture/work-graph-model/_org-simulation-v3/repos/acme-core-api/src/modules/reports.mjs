export function buildRevenueReport({ invoices }) {
  const total = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  return {
    id: "report-revenue-daily",
    rows: invoices.length,
    total,
    generatedAt: "2026-07-02T00:00:00.000Z",
  };
}

export function exportCsv(report) {
  return `id,rows,total\n${report.id},${report.rows},${report.total}\n`;
}
