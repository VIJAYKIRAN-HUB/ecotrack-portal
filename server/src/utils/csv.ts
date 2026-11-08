export function generateCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(escapeCsv).join(',');
  const dataRows = rows.map((row) =>
    headers.map((h) => escapeCsv(row[h])).join(',')
  );

  return [headerRow, ...dataRows].join('\r\n');
}
