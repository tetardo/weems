/** CSV as OurAirports and the API's data files write it: "quoted" fields, "" escapes, no line breaks in a field. */

/** Fields of one CSV line (RFC 4180, no line breaks in fields). */
export function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted && char === '"' && line[i + 1] === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      fields.push(field);
      field = "";
    } else field += char;
  }
  fields.push(field);
  return fields;
}

/** A line of a CSV file: its cell in a column named by the header; "" when missing. */
export type CsvRow = (column: string) => string;

/** Lines of a CSV text, their cells read by the header's column names. */
export function parseCsv(text: string): CsvRow[] {
  const [header = "", ...lines] = text.split(/\r?\n/).filter((line) => line.length > 0);
  const columns = new Map(splitCsvLine(header).map((name, index) => [name, index]));
  return lines.map((line) => {
    const fields = splitCsvLine(line);
    return (column) => fields[columns.get(column) ?? -1] ?? "";
  });
}

type Cell = string | number | boolean | null;

const cellText = (cell: Cell): string => {
  if (cell === null) return "";
  if (typeof cell === "boolean") return cell ? "1" : "0";
  const text = String(cell);
  return /[",]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/** A CSV text: the header, then one line per row, cells quoted when they hold a comma or a quote. */
export function formatCsv(header: readonly string[], rows: readonly (readonly Cell[])[]): string {
  return `${[header, ...rows].map((row) => row.map(cellText).join(",")).join("\n")}\n`;
}

/** Readers of a parsed cell: "" is null. */
export const text = (value: string): string | null => (value ? value : null);
export const integer = (value: string): number | null => (value ? Math.round(Number(value)) : null);
export const decimal = (value: string): number | null => (value ? Number(value) : null);
